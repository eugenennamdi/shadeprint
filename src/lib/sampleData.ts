export interface SampleStop {
  id: string;
  locationLabel: string;
  imagePath: string;
  expectedCategory: 'tree_shade' | 'built_shade' | 'exposed';
  note: string;
  fieldAnnotation: string;
}

export const SAMPLE_STOPS: SampleStop[] = [
  {
    id: 'sample-01',
    locationLabel: 'Residential tree canopy (Elm Grove)',
    imagePath: '/samples/sample_tree_shade.jpg',
    expectedCategory: 'tree_shade',
    note: 'Lush mature deciduous tree canopy casting heavy, dappled shade over the entire walking path.',
    fieldAnnotation: 'Stop 01 · Neighborhood sidewalk with mature canopy coverage',
  },
  {
    id: 'sample-02',
    locationLabel: 'Commercial arcade & awning (Market Row)',
    imagePath: '/samples/sample_built_shade.jpg',
    expectedCategory: 'built_shade',
    note: 'Deep architectural shadow cast by multistory building facade and wide storefront awning.',
    fieldAnnotation: 'Stop 02 · Urban streetscape with structural shade',
  },
  {
    id: 'sample-03',
    locationLabel: 'Open sun-exposed esplanade (Central Plaza)',
    imagePath: '/samples/sample_exposed.jpg',
    expectedCategory: 'exposed',
    note: 'Direct mid-day sunlight across wide concrete pedestrian path with zero overhead or vertical shade.',
    fieldAnnotation: 'Stop 03 · Sun-drenched open pedestrian avenue',
  },
];
