import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../../config/firebaseConfig';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const auth = getAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(true); // Show modal to encourage login
  const [isRegistering, setIsRegistering] = useState(false);

  // State to track food, water, today's log, nutritional facts, and goals
  const [food, setFood] = useState('');
  const [water, setWater] = useState('');
  const [suggestions, setSuggestions] = useState<{ label: string; nutrients: any }[]>([]);
  const [logEntries, setLogEntries] = useState<{ type: string; value: string }[]>([]);
  const [selectedFood, setSelectedFood] = useState<{ label: string; nutrients: any } | null>(null);
  const [totalWater, setTotalWater] = useState(0);
  const [nutritionalFacts, setNutritionalFacts] = useState({ calories: 0, protein: 0, carbs: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());

  // State for goals
  const [goals, setGoals] = useState({ water: 100, calories: 2000, protein: 150, carbs: 300 });

   // Handle goal changes
   const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    setGoals((prevGoals) => ({
      ...prevGoals,
      [type]: parseInt(e.target.value) || 0,
    }));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        setUsername(user.email || 'User');
        setShowModal(false); // Hide modal when logged in
      } else {
        setIsLoggedIn(false);
        setShowModal(true); // Show modal to encourage login
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Fetch food suggestions from the API
  const getFoodSuggestions = async (foodItem: string) => {
    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${foodItem}&search_simple=1&action=process&json=1`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        return data.products.map((product: { product_name: string; nutriments: any }) => ({
          label: product.product_name,
          nutrients: product.nutriments,
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching food suggestions:', error);
      return [];
    }
  };

  // Handle input change for food search
  const handleFoodInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const foodItem = e.target.value;
    setFood(foodItem);

    if (foodItem.length > 2) {
      const foodSuggestions = await getFoodSuggestions(foodItem);
      setSuggestions(foodSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Handle selection of a food suggestion
  const handleFoodSelection = (foodItem: { label: string; nutrients: any }) => {
    setFood(foodItem.label);
    setSelectedFood(foodItem); // Store the selected food for logging
    setSuggestions([]); // Clear suggestions after selection
  };

  // Handle form submission
  const handleAddIntake = async (e: React.FormEvent) => {
    e.preventDefault();

    let newEntries = [];
    let newNutritionalFacts = { ...nutritionalFacts };
    let newTotalWater = totalWater;

    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to add your intake.');
      return;
    }

    // Add food to the log and fetch nutritional data
    if (selectedFood) {
      const { label, nutrients } = selectedFood;
      newEntries.push({ type: 'Food', value: label });
      newNutritionalFacts = {
        calories: newNutritionalFacts.calories + (nutrients['energy-kcal'] || 0),
        protein: newNutritionalFacts.protein + (nutrients.proteins || 0),
        carbs: newNutritionalFacts.carbs + (nutrients.carbohydrates || 0),
      };

      // Store in Firestore
      try {
        await addDoc(collection(db, 'intakeLogs'), {
          type: 'Food',
          value: label,
          date: Timestamp.fromDate(new Date()),
          nutrition: nutrients,
          userId: user.uid,
        });
      } catch (error) {
        console.error('Error adding food intake to Firestore:', error);
      }

      setFood('');
      setSelectedFood(null); // Clear the selected food
    }

    // Add water to the log
    if (water) {
      const waterAmount = parseInt(water);
      newEntries.push({ type: 'Water', value: `${waterAmount} oz` });
      newTotalWater += waterAmount;

      // Store in Firestore
      try {
        await addDoc(collection(db, 'intakeLogs'), {
          type: 'Water',
          value: `${waterAmount} oz`,
          date: Timestamp.fromDate(new Date()),
          userId: user.uid,
        });
      } catch (error) {
        console.error('Error adding water intake to Firestore:', error);
      }

      setWater('');
    }

    // Update state
    setLogEntries((prevEntries) => [...prevEntries, ...newEntries]);
    setNutritionalFacts(newNutritionalFacts);
    setTotalWater(newTotalWater);
  };

  // Handle login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowModal(false);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowModal(false);
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUsername('');
      setLogEntries([]);
      setNutritionalFacts({ calories: 0, protein: 0, carbs: 0 });
      setTotalWater(0);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-800">
        <img className="logo" src="../images/Logo.png" alt="Logo" />
        <div>
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <span className="text-neon-purple">{username}</span>
              <button onClick={handleLogout} className="px-4 py-2 bg-neon-green rounded hover:bg-neon-green-hover">
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-neon-purple rounded hover:bg-neon-purple-hover">
                Login/Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Login/Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded shadow-md w-96 space-y-4">
            <h2 className="text-2xl font-semibold text-neon-green">{isRegistering ? 'Register' : 'Login'}</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
              placeholder="Enter email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
              placeholder="Enter password"
            />
            <button
              onClick={isRegistering ? handleRegister : handleLogin}
              className="w-full py-2 bg-neon-green rounded hover:bg-neon-green-hover"
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
            <button onClick={() => setIsRegistering(!isRegistering)} className="w-full py-2 bg-gray-600 rounded hover:bg-gray-700">
              {isRegistering ? 'Switch to Login' : 'Switch to Register'}
            </button>
            <button onClick={() => setShowModal(false)} className="w-full py-2 bg-gray-600 rounded hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
                   <main className="py-8 space-y-8">
                     <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                       {/* Intake Form */}
                       <section className="flex-1 p-4 bg-gray-900 rounded shadow-md">
                         <h2 className="text-2xl font-semibold text-neon-green mb-4">Add Today's Intake</h2>
                         <form onSubmit={handleAddIntake} className="flex flex-col space-y-4">
                           <div>
                             <label className="block text-neon-green">Food</label>
                             <input
                               type="text"
                               value={food}
                               onChange={handleFoodInputChange}
                               className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
                               placeholder="Enter food item"
                             />
                             {suggestions.length > 0 && (
                               <ul className="bg-gray-800 p-2 mt-1 max-h-32 overflow-y-auto rounded">
                                 {suggestions.map((item, index) => (
                                   <li
                                     key={index}
                                     className="cursor-pointer p-2 hover:bg-gray-700"
                                     onClick={() => handleFoodSelection(item)}
                                   >
                                     {item.label}
                                   </li>
                                 ))}
                               </ul>
                             )}
                           </div>
                           <div>
                             <label className="block text-neon-green">Water (oz)</label>
                             <input
                               type="number"
                               value={water}
                               onChange={(e) => setWater(e.target.value)}
                               className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
                               placeholder="Enter water intake in oz"
                             />
                           </div>
                           <button
                             type="submit"
                             className="w-full py-2 mt-4 bg-neon-purple rounded hover:bg-neon-purple-hover"
                           >
                             Add Intake
                           </button>
                         </form>
                       </section>
             
                       {/* Daily Log */}
                       <section className="flex-1 p-4 bg-gray-900 rounded shadow-md">
                         <h2 className="text-2xl font-semibold text-neon-green mb-4">Today's Log</h2>
                         <p className="text-gray-400 mb-4">{currentDate.toDateString()}</p> {/* Display Current Date */}
                         <div className="space-y-2">
                           {logEntries.length > 0 ? (
                             logEntries.map((entry, index) => (
                               <div key={index} className="p-2 bg-gray-800 rounded">
                                 <p className="text-neon-purple">
                                   {entry.type}: {entry.value}
                                 </p>
                               </div>
                             ))
                           ) : (
                             <p className="text-neon-purple">No items added yet.</p>
                           )}
                         </div>
                       </section>
                     </div>
             
                     {/* Statistics */}
                     <section className="flex-1 p-4 bg-gray-900 rounded shadow-md">
                       <h2 className="text-2xl font-semibold text-neon-green mb-4">Statistics</h2>
             
                       {/* Goal Inputs */}
                       <div className="mb-4">
                         <h3 className="text-xl text-neon-green mb-2">Set Your Daily Goals</h3>
                         <div className="flex flex-col space-y-2">
                           <div>
                             <label className="block text-neon-green">Water Goal (oz):</label>
                             <input
                               type="number"
                               value={goals.water}
                               onChange={(e) => handleGoalChange(e, 'water')}
                               className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
                             />
                           </div>
                           <div>
                             <label className="block text-neon-green">Calorie Goal (kcal):</label>
                             <input
                               type="number"
                               value={goals.calories}
                               onChange={(e) => handleGoalChange(e, 'calories')}
                               className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
                             />
                           </div>
                           <div>
                             <label className="block text-neon-green">Protein Goal (g):</label>
                             <input
                               type="number"
                               value={goals.protein}
                               onChange={(e) => handleGoalChange(e, 'protein')}
                               className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
                             />
                           </div>
                           <div>
                             <label className="block text-neon-green">Carbs Goal (g):</label>
                             <input
                               type="number"
                               value={goals.carbs}
                               onChange={(e) => handleGoalChange(e, 'carbs')}
                               className="w-full p-2 mt-1 bg-black border border-neon-purple rounded focus:outline-none focus:border-neon-green"
                             />
                           </div>
                         </div>
                       </div>
             
                       {/* Progress Bars */}
                       <div className="mb-4">
                         <p className="text-neon-green">
                           Water Intake: {totalWater} oz / {goals.water} oz ({Math.round((totalWater / goals.water) * 100)}%)
                         </p>
                         <div className="w-full bg-gray-700 rounded h-4 mt-2">
                           <div className="bg-neon-green h-4 rounded" style={{ width: `${Math.min((totalWater / goals.water) * 100, 100)}%` }}></div>
                         </div>
                       </div>
             
                       <div className="mb-4">
                         <p className="text-neon-green">
                           Calories: {nutritionalFacts.calories} kcal / {goals.calories} kcal ({Math.round((nutritionalFacts.calories / goals.calories) * 100)}%)
                         </p>
                         <div className="w-full bg-gray-700 rounded h-4 mt-2">
                           <div className="bg-neon-purple h-4 rounded" style={{ width: `${Math.min((nutritionalFacts.calories / goals.calories) * 100, 100)}%` }}></div>
                         </div>
                       </div>
             
                       <div className="mb-4">
                         <p className="text-neon-green">
                           Protein: {nutritionalFacts.protein} g / {goals.protein} g ({Math.round((nutritionalFacts.protein / goals.protein) * 100)}%)
                         </p>
                         <div className="w-full bg-gray-700 rounded h-4 mt-2">
                           <div className="bg-neon-purple-hover h-4 rounded" style={{ width: `${Math.min((nutritionalFacts.protein / goals.protein) * 100, 100)}%` }}></div>
                         </div>
                       </div>
             
                       <div className="mb-4">
                         <p className="text-neon-green">
                           Carbs: {nutritionalFacts.carbs} g / {goals.carbs} g ({Math.round((nutritionalFacts.carbs / goals.carbs) * 100)}%)
                         </p>
                         <div className="w-full bg-gray-700 rounded h-4 mt-2">
                           <div className="bg-neon-deep-purple h-4 rounded" style={{ width: `${Math.min((nutritionalFacts.carbs / goals.carbs) * 100, 100)}%` }}></div>
                         </div>
                       </div>
                     </section>
                   </main>
                 </div>
               );
             };
             
             export default Home;
             
