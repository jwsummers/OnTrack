import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

// Define the structure of an intake log entry
interface IntakeLog {
  id: string;
  type: 'Food' | 'Water';
  value: string;
  date: {
    toDate: () => Date;
  };
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
  };
}

const History = () => {
  const [history, setHistory] = useState<{ [key: string]: IntakeLog[] }>({});
  const [loading, setLoading] = useState(true);

  // Fetch intake history for the logged-in user
  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'intakeLogs'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc') // Order logs by date (most recent first)
        );
        const querySnapshot = await getDocs(q);
        const entries = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as IntakeLog[];

        // Debugging: Log the fetched entries
        console.log("Fetched entries:", entries);

        // Organize logs by date
        const organizedLogs = entries.reduce((acc: { [key: string]: IntakeLog[] }, entry) => {
          // Check if entry.date exists and can be converted to a Date object
          const entryDate = entry.date && entry.date.toDate ? entry.date.toDate().toDateString() : "Invalid Date";
          if (!acc[entryDate]) {
            acc[entryDate] = [];
          }
          acc[entryDate].push(entry);
          return acc;
        }, {});

        // Debugging: Log the organized logs
        console.log("Organized logs by date:", organizedLogs);

        setHistory(organizedLogs);
      } catch (error) {
        console.error('Error fetching intake history:', error);
      }

      setLoading(false);
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <h1 className="text-3xl font-bold text-neon-green mb-4">Intake History</h1>
      <div className="w-full max-w-md p-4 bg-gray-900 rounded shadow-md">
        {loading ? (
          <p className="text-neon-purple">Loading history...</p>
        ) : Object.keys(history).length === 0 ? (
          <p className="text-neon-purple">No history available.</p>
        ) : (
          Object.keys(history).map((date) => (
            <div key={date} className="mb-6">
              <h2 className="text-xl font-semibold text-neon-purple mb-2">{date}</h2>
              <ul className="space-y-2">
                {history[date].map((entry) => (
                  <li key={entry.id} className="p-2 bg-gray-800 rounded">
                    {entry.type === 'Food' ? (
                      <div>
                        <span className="text-neon-green font-semibold">{entry.value}</span> -{' '}
                        <span className="text-gray-400">
                          {entry.nutrition?.calories} kcal, {entry.nutrition?.protein} g protein, {entry.nutrition?.carbs} g carbs
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-neon-green font-semibold">Water</span> -{' '}
                        <span className="text-gray-400">{entry.value}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
