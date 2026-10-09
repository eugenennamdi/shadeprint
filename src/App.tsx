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

  // Load saved sessions from IndexedDB on startup
  useEffect(() => {
    const loadPastData = async () => {
      try {
        const sessions = await getAllSessions();
        // Sort descending by startedAt
        sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        setPastSessions(sessions);
      } catch (err) {
        console.error('Failed to load past sessions:', err);
      }
    };
    loadPastData();
  }, []);

  // Start real neighborhood walk
  const handleStartWalk = () => {
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
    if (!activeSession || !pendingPhoto) return;

    const newObservation: Observation = {
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

    const updatedObservations = [...activeSession.observations, newObservation];
    const isFinished = updatedObservations.length >= 3;

    const updatedSession: FieldSession = {
      ...activeSession,
      observations: updatedObservations,
      completedAt: isFinished ? new Date().toISOString() : undefined,
    };

    setActiveSession(updatedSession);
    setPendingPhoto(null);

    // Persist to IndexedDB
    try {
      await saveSession(updatedSession);
      const all = await getAllSessions();
      all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      setPastSessions(all);
    } catch (err) {
      console.error('Failed to save session to IndexedDB:', err);
    }

    // Advance to between stops screen
    setCurrentScreen('between');
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

  // Reset current walk
  const handleResetWalk = () => {
    if (window.confirm('Reset this field session and return to the beginning?')) {
      setActiveSession(null);
      setPendingPhoto(null);
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
            onRetake={() => setCurrentScreen('capture')}
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
