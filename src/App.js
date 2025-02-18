import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const App = () => {
  const { user, login } = useAuth();
  console.log("User", user);
  const URL = "https://a4-jackthompson101.onrender.com";
  console.log("URL", URL);

  const [lifts, setLifts] = useState([]);
  const [inlineData, setInlineData] = useState({});
  const [formData, setFormData] = useState({
    exercise: '',
    reps: '',
    weight: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${URL}/getUserData`, {
          credentials: 'include'
        });
        console.log("Response", res);
        console.log("URL", `${URL}/getUserData`);
        if (!res.ok) throw new Error('Failed to fetch user data');
        const data = await res.json();
        login(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (!user) {
      fetchUserData();
    }
  }, [user, login]);

  const fetchLifts = async () => {
    try {
      const res = await fetch(`${URL}/getLifts`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch lifts');
      const data = await res.json();
      console.log('Lifts:', data);
      setLifts(data);
    } catch (error) {
      console.error('Error fetching lifts:', error);
    }
  };

  useEffect(() => {
    const data = {};
    lifts.forEach(lift => {
      data[lift._id] = { reps: lift.reps, weight: lift.weight };
    });
    setInlineData(data);
  }, [lifts]);

  const calculate1RM = (weight, reps) => {
    if (Number(reps) === 0) return 0;
    return Number(weight) * (1 + Number(reps) / 30);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevData => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.exercise || !formData.reps || !formData.weight) {
      alert('Please fill in all fields.');
      return;
    }

    const existingLift = lifts.find(lift => lift.lift === formData.exercise);

    try {
      let response;
      if (existingLift) {
        response = await fetch(`${URL}/update`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise: formData.exercise,
            reps: formData.reps,
            weight: formData.weight
          })
        });
      } else {
        response = await fetch(`${URL}/submit`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise: formData.exercise,
            reps: formData.reps,
            weight: formData.weight
          })
        });
      }

      if (!response.ok) {
        const errorMessage = await response.text();
        alert('Error: ' + errorMessage);
        return;
      }
      fetchLifts();
      setFormData({ exercise: '', reps: '', weight: '' });
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  const handleDelete = async (exercise) => {
    if (!window.confirm(`Are you sure you want to delete "${exercise}"?`)) return;
    try {
      const response = await fetch(`${URL}/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise })
      });
      if (!response.ok) {
        const errorMessage = await response.text();
        alert('Error: ' + errorMessage);
        return;
      }
      fetchLifts();
    } catch (error) {
      console.error('Error deleting lift:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLifts();
    }
  }, [user]);
  

  const handleInlineChange = (id, field, value) => {
    setInlineData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const updateRow = async (exercise, id) => {
    const originalLift = lifts.find(l => l._id === id);
    const updated = inlineData[id];
    if (
      originalLift.reps === updated.reps &&
      originalLift.weight === updated.weight
    ) {
      return;
    }

    try {
      const response = await fetch(`${URL}/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise,
          reps: updated.reps,
          weight: updated.weight,
        })
      });
      if (!response.ok) {
        const errorMessage = await response.text();
        alert('Error updating lift: ' + errorMessage);
        return;
      }
      fetchLifts();
    } catch (error) {
      console.error('Error updating lift:', error);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center text-center bg-[#222] text-white m-0 p-5 min-h-screen"
      style={{ fontFamily: "'Archivo Black', Arial, sans-serif" }}
    >
      <img
        src="https://pngimg.com/uploads/barbell/barbell_PNG16360.png"
        className="w-20"
        alt="Barbell"
      />
      <header>
        <h1
          id="header"
          className="text-[#ff0000] mb-2 font-bold"
          style={{ textShadow: '2px 2px 4px black' }}
        >
          1 Rep Max Tracker
        </h1>
        <h2 className="mb-4">
          Welcome, <span id="user-name">{user ? user.firstName : 'Loading...'}</span>!
        </h2>
      </header>

      {user && (
        <div id="user-profile" className="mb-4">
          <p id="user-username" className="m-0 p-0 leading-[1.2]">Username: {user.username}</p>
        </div>
      )}

      <p className="mb-4">
        Enter a new exercise or modify the reps/weight of another one.
        <br />
        Then we can project your 1 rep max using Epley's formula.
        <br /><br />
      </p>

      <div className="flex flex-col justify-center items-center w-full">
        <table
          id="dataTable"
          className="w-[60%] border-collapse bg-[#222] shadow-[0_4px_8px_rgba(255,0,0,0.3)] text-white"
        >
          <thead>
            <tr>
              <th className="border border-[#ff0000] p-2 text-center bg-[#ff0000] text-black font-bold">
                Exercise
              </th>
              <th className="border border-[#ff0000] p-2 text-center bg-[#ff0000] text-black font-bold">
                Reps
              </th>
              <th className="border border-[#ff0000] p-2 text-center bg-[#ff0000] text-black font-bold">
                Weight
              </th>
              <th className="border border-[#ff0000] p-2 text-center bg-[#ff0000] text-black font-bold">
                Projected 1 RPM
              </th>
              <th className="border border-[#ff0000] p-2 text-center bg-[#ff0000] text-black font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {lifts.map((lift) => (
              <tr key={lift._id}>
                <td className="border border-[#ff0000] p-2">{lift.lift}</td>
                <td className="border border-[#ff0000] p-2">
                  <input
                    type="text"
                    value={inlineData[lift._id]?.reps || ''}
                    onChange={(e) =>
                      handleInlineChange(lift._id, 'reps', e.target.value)
                    }
                    onBlur={() => updateRow(lift.lift, lift._id)}
                    className="w-full p-1 border border-[#ff0000] rounded bg-[#333] text-white text-center"
                  />
                </td>
                <td className="border border-[#ff0000] p-2">
                  <input
                    type="text"
                    value={inlineData[lift._id]?.weight || ''}
                    onChange={(e) =>
                      handleInlineChange(lift._id, 'weight', e.target.value)
                    }
                    onBlur={() => updateRow(lift.lift, lift._id)}
                    className="w-full p-1 border border-[#ff0000] rounded bg-[#333] text-white text-center"
                  />
                </td>
                <td className="border border-[#ff0000] p-2">
                  {calculate1RM(
                    inlineData[lift._id]?.weight || lift.weight,
                    inlineData[lift._id]?.reps || lift.reps
                  ).toFixed(2)}
                </td>
                <td className="border border-[#ff0000] p-2">
                  <button
                    className="px-2 py-1 bg-[#ff0000] text-black rounded"
                    onClick={() => handleDelete(lift.lift)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form
          id="dataForm"
          className="flex flex-row justify-center items-center gap-2 mb-5 w-[60%]"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            id="exercise"
            placeholder="Exercise"
            value={formData.exercise}
            onChange={handleInputChange}
            className="w-[90%] p-1 border border-[#ff0000] rounded bg-[#333] text-white text-center placeholder-white/60 focus:outline-none"
          />
          <input
            type="text"
            id="reps"
            placeholder="Reps"
            value={formData.reps}
            onChange={handleInputChange}
            className="w-[90%] p-1 border border-[#ff0000] rounded bg-[#333] text-white text-center placeholder-white/60 focus:outline-none"
          />
          <input
            type="text"
            id="weight"
            placeholder="Weight"
            value={formData.weight}
            onChange={handleInputChange}
            className="w-[90%] p-1 border border-[#ff0000] rounded bg-[#333] text-white text-center placeholder-white/60 focus:outline-none"
          />
          <button
            type="submit"
            id="submit-button"
            className="px-3 py-2 rounded font-bold transition duration-300 bg-[#ff0000] text-black cursor-pointer hover:bg-[#cc0000] hover:scale-105"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
