import { createContext, useContext, useState } from 'react';

// Globalny kontekst przechowujący historię treningów.
// Wydzielony poza nawigację, żeby zarówno AktywnyTrening jak i Profil
// miały dostęp do tych samych danych bez prop drillingu
const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [history, setHistory] = useState([]);

  // Dodaje ukończony trening do historii – docelowo zsynchronizowane z Firestore
  const saveWorkout = (workoutData) => {
    setHistory((prev) => [
      { ...workoutData, id: Date.now().toString(), savedAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  return (
    <WorkoutContext.Provider value={{ history, saveWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Hook skracający import w komponentach – zamiast importować useContext i WorkoutContext osobno
export const useWorkout = () => useContext(WorkoutContext);