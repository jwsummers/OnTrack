// src/pages/Log.tsx
import LogIntakeForm from '../components/LogIntakeForm';

const Log = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">Log Intake</h1>
      <LogIntakeForm />
    </div>
  );
};

export default Log;
