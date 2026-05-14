// shared/store/index.js
// Store combinado con slices de dominio

import { create } from 'zustand';
import { createAnalysisSlice } from './analysisSlice';
import { createUISlice } from './uiSlice';
import { createHistorySlice } from './historySlice';

const useAppStore = create((...a) => ({
  ...createAnalysisSlice(...a),
  ...createUISlice(...a),
  ...createHistorySlice(...a),
}));

export default useAppStore;
