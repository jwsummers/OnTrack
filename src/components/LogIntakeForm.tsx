// src/components/LogIntakeForm.tsx
import { useState } from 'react';
import { db } from '../../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const LogIntakeForm = () => {
  const [food, setFood] = useState('');
  const [water, setWater] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'intakeLogs'), {
        food,
        water,
        date: new Date(),
      });
      setFood('');
      setWater('');
      setError(null);
      console.log('Intake logged successfully');
    } catch (err: any) {
      setError('Error logging intake');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-white rounded shadow-md max-w-md mx-auto">
      <div>
        <label className="block text-gray-700">Food Intake</label>
        <input
          type="text"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-1"
          placeholder="Enter food"
        />
      </div>
      <div>
        <label className="block text-gray-700">Water Intake (ml)</label>
        <input
          type="number"
          value={water}
          onChange={(e) => setWater(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-1"
          placeholder="Enter water intake"
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" className="bg-blue-500 text-white py-2 rounded">
        Log Intake
      </button>
    </form>
  );
};

export default LogIntakeForm;
