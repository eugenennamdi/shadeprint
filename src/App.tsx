import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { AboutModal } from '@/components/AboutModal';
import { IntroductionScreen } from '@/features/field-session/IntroductionScreen';
import { PhotoCaptureScreen } from '@/features/field-session/PhotoCaptureScreen';
import { ObservationReviewScreen } from '@/features/field-session/ObservationReviewScreen';
import { BetweenStopsScreen } from '@/features/field-session/BetweenStopsScreen';
import { FieldReportScreen } from '@/features/report/FieldReportScreen';
import { 
  FieldSession, 
  Observation, 
  ShadeCategory, 
  ModelScoreDetail 
} from '@/types';
import { 
  saveSession, 
  getAllSessions, 
  deleteSession, 
  clearAllData 
} from '@/lib/storage/db';
import { SAMPLE_STOPS } from '@/lib/sampleData';
import { playObservationConfirmed, playWalkCompleted } from '@/lib/sound/soundEffects';

type ScreenState = 'intro' | 'capture' | 'review' | 'between' | 'report';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('intro');
  const [activeSession, setActiveSession] = useState<FieldSession | null>(null);
  const [pastSessions, setPastSessions] = useState<FieldSession[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  
  // Pending photo capture before review
  const [pendingPhoto, setPendingPhoto] = useState<{
    dataUrl: string;
    locationLabel?: string;
  } | null>(null);

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [inProgressSession, setInProgressSession] = useState<FieldSession | null>(null);

  // Persistence failure recovery states
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [pendingObservation, setPendingObservation] = useState<Observation | null>(null);

  // Load saved sessions from IndexedDB on startup
  useEffect(() => {
    const loadPastData = async () => {
      try {
        const sessions = await getAllSessions();
        // Sort descending by startedAt
        sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        setPastSessions(sessions);

        // Detect in-progress interrupted walk
        const unfinished = sessions.find(
          (s) => !s.completedAt && s.observations.length > 0 && s.observations.length < 3
        );
        setInProgressSession(unfinished || null);
      } catch (err) {
        console.error('Failed to load past sessions:', err);
      }
    };
    loadPastData();
  }, []);

  // Start real neighborhood walk
  const handleStartWalk = () => {
    setPersistenceError(null);
    setPendingObservation(null);
    const newSession: FieldSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: [],
    };
    setActiveSession(newSession);
    setCurrentStopIndex(0);
    setPendingPhoto(null);
    setCurrentScreen('capture');
  };

  // Start sample mode demonstration
  const handleStartSample = () => {
    setPersistenceError(null);
    setPendingObservation(null);
    const newSession: FieldSession = {
      id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      startedAt: new Date().toISOString(),
      mode: 'sample',
      observations: [],
    };
    setActiveSession(newSession);
    setCurrentStopIndex(0);
    setPendingPhoto(null);
    setCurrentScreen('capture');
  };

  // When photo is chosen on Capture Screen
  const handlePhotoSelected = (photoDataUrl: string, locationLabel?: string) => {
    setPersistenceError(null);
    setPendingObservation(null);
    setPendingPhoto({ dataUrl: photoDataUrl, locationLabel });
    setCurrentScreen('review');
  };

  // When user confirms observation on Review Screen
  const handleConfirmObservation = async (
    finalCategory: ShadeCategory,
    aiSuggestedCategory?: ShadeCategory,
    scores?: ModelScoreDetail[],
    userNote?: string
  ) => {
    if (!activeSession || !pendingPhoto || isSavingObservation) return;

    // Preserve existing observation id if retrying after failure to prevent duplicate creation
    const observationToSave: Observation = pendingObservation
      ? {
          ...pendingObservation,
          finalCategory,
          aiSuggestedCategory,
          modelScoreDetails: scores,
          userNote,
        }
      : {
          id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId: activeSession.id,
          createdAt: new Date().toISOString(),
          photoDataUrl: pendingPhoto.dataUrl,
          locationLabel: pendingPhoto.locationLabel,
          aiSuggestedCategory,
          modelScoreDetails: scores,
          finalCategory,
          modelStatus: scores && scores.length > 0 ? 'success' : 'bypassed',
          userNote,
        };

    const updatedObservations = [...activeSession.observations, observationToSave];
    const isFinished = updatedObservations.length >= 3;

    const updatedSession: FieldSession = {
      ...activeSession,
      observations: updatedObservations,
      completedAt: isFinished ? new Date().toISOString() : undefined,
    };

    setIsSavingObservation(true);
    setPersistenceError(null);

    // Step 1: Critical write to IndexedDB
    try {
      await saveSession(updatedSession);
    } catch (err: any) {
      console.error('Failed to save session to IndexedDB:', err);
      // Retain observation and photo in memory so user does not lose their work
      setPendingObservation(observationToSave);
      setIsSavingObservation(false);
      setPersistenceError(
        err?.message || 'Could not save observation to browser storage (quota exceeded or storage restricted). Your observation is held safely in memory.'
      );
      // DO NOT advance to between screen. Stay on review screen.
      return;
    }

    // Step 2: Critical save succeeded - commit state and advance screen
    setActiveSession(updatedSession);
    setPendingPhoto(null);
    setPendingObservation(null);
    setPersistenceError(null);
    setIsSavingObservation(false);

    // Trigger completion sound only after genuine 3rd observation confirmed & persisted
    if (isFinished) {
      playWalkCompleted();
    } else {
      playObservationConfirmed();
    }

    // Advance to between stops screen
    setCurrentScreen('between');

    // Step 3: Non-critical background archive refresh
    try {
      const all = await getAllSessions();
      all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      setPastSessions(all);
    } catch (err) {
      console.warn('Non-fatal: Failed to refresh background session archive:', err);
    }
  };

  // Retry saving the failed observation
  const handleRetrySaveObservation = async () => {
    if (!activeSession || !pendingPhoto || !pendingObservation || isSavingObservation) return;
    await handleConfirmObservation(
      pendingObservation.finalCategory,
      pendingObservation.aiSuggestedCategory,
      pendingObservation.modelScoreDetails,
      pendingObservation.userNote
    );
  };

  // Continue to next stop
  const handleContinueWalk = () => {
    if (!activeSession) return;
    const nextIndex = activeSession.observations.length;
    setCurrentStopIndex(nextIndex);
    setCurrentScreen('capture');
  };

  // View final field report
  const handleFinishSession = () => {
    setCurrentScreen('report');
  };

  // View a previously saved report from the archive
  const handleViewPastReport = (session: FieldSession) => {
    setActiveSession(session);
    setCurrentScreen('report');
  };

  // Resume interrupted walk
  const handleResumeWalk = (session: FieldSession) => {
    setActiveSession(session);
    setCurrentStopIndex(session.observations.length);
    setPendingPhoto(null);
    setInProgressSession(null);
    setCurrentScreen('between');
  };

  // Discard interrupted walk
  const handleDiscardWalk = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setInProgressSession(null);
      const all = await getAllSessions();
      all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      setPastSessions(all);
    } catch (err) {
      console.error('Failed to discard interrupted walk:', err);
    }
  };

  // Reset current walk
  const handleResetWalk = () => {
    if (window.confirm('Reset this field session and return to the beginning?')) {
      setActiveSession(null);
      setPendingPhoto(null);
      setPendingObservation(null);
      setPersistenceError(null);
      setCurrentStopIndex(0);
      setCurrentScreen('intro');
    }
  };

  // Delete a specific session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      const all = await getAllSessions();
      all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      setPastSessions(all);
      setActiveSession(null);
      setCurrentScreen('intro');
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Wipe all stored sessions
  const handleClearAllData = async () => {
    try {
      await clearAllData();
      setPastSessions([]);
      setInProgressSession(null);
      setActiveSession(null);
      setCurrentScreen('intro');
    } catch (err) {
      console.error('Failed to clear data:', err);
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col font-sans">
      {/* Header bar */}
      <Header
        mode={activeSession?.mode}
        isSessionActive={currentScreen !== 'intro'}
        onReset={handleResetWalk}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Dynamic Screen Area */}
      <main className="flex-1 flex flex-col">
        {currentScreen === 'intro' && (
          <IntroductionScreen
            onStartWalk={handleStartWalk}
            onStartSample={handleStartSample}
            onViewPastReport={handleViewPastReport}
            pastSessions={pastSessions}
            inProgressSession={inProgressSession}
            onResumeWalk={handleResumeWalk}
            onDiscardWalk={handleDiscardWalk}
          />
        )}

        {currentScreen === 'capture' && (
          <PhotoCaptureScreen
            currentStopIndex={currentStopIndex}
            totalStops={3}
            isSampleMode={activeSession?.mode === 'sample'}
            sampleStop={
              activeSession?.mode === 'sample' ? SAMPLE_STOPS[currentStopIndex] : undefined
            }
            onPhotoSelected={handlePhotoSelected}
            onCancel={() => {
              setActiveSession(null);
              setCurrentScreen('intro');
            }}
          />
        )}

        {currentScreen === 'review' && pendingPhoto && (
          <ObservationReviewScreen
            currentStopIndex={currentStopIndex}
            totalStops={3}
            photoDataUrl={pendingPhoto.dataUrl}
            locationLabel={pendingPhoto.locationLabel}
            onConfirmObservation={handleConfirmObservation}
            onRetake={() => {
              setPersistenceError(null);
              setPendingObservation(null);
              setCurrentScreen('capture');
            }}
            persistenceError={persistenceError}
            onRetrySave={handleRetrySaveObservation}
            isSaving={isSavingObservation}
          />
        )}

        {currentScreen === 'between' && activeSession && (
          <BetweenStopsScreen
            completedObservations={activeSession.observations}
            totalStops={3}
            onContinueWalk={handleContinueWalk}
            onFinishSession={handleFinishSession}
          />
        )}

        {currentScreen === 'report' && activeSession && (
          <FieldReportScreen
            session={activeSession}
            onStartNewWalk={() => {
              setActiveSession(null);
              setCurrentScreen('intro');
            }}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </main>

      {/* About & Privacy Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}

export default App;
