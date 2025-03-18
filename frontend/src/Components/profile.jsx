import React from 'react';
import { Pencil } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function Profile() {
  const location = useLocation();
  const { logout } = useAuth();

  const categories = [
    { name: 'Profile Settings', path: '/profile-settings' },
    { name: 'Auctions', path: '/my-auctions' },
    { name: 'Watchlist', path: '/watchlist' },
    { name: 'Purchase History', path: '/purchase-history' }
  ];

  // Helper to check active link
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-100 p-6 flex flex-col justify-between">
        <div className="space-y-4">
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className={`block p-2 rounded-md ${
                isActive(category.path)
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full p-2 rounded-md mt-6 ${
            isActive('/logout')
              ? 'bg-green-500 text-white'
              : 'hover:bg-gray-200'
          }`}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}

      <div className="w-4/5 p-8 overflow-auto">
      {location.pathname === '/profile-settings' && <ProfileSettings />}
      {location.pathname === '/my-auctions' && <MyAuctions />}
      {location.pathname === '/watchlist' && <Watchlist />} 
      {location.pathname === '/purchase-history' && <PurchaseHistory />} 
      </div>
    </div>
  );
}



function ProfileSettings() {
 
  const [editPageOpen, setEditPageOpen] = useState(false);
  const { user } = useAuth();
  // const [inputValue, setInputValue] = useState(user);
  const initialData = {
   username: '',
   email: '',
   phone: '',
   gender: '',
   expertise: ''
 };
  const [formData, setFormData] = useState(initialData);
  const [isSaved, setIsSaved] = useState(true);

  const handleChange = (e) => {
   const { name, value } = e.target;
   setFormData((prev) => ({
     ...prev,
     [name]: value
   }));
   setIsSaved(false);
 };

  const handleSubmit = async (e) => {
   
   try {
     await axios.put(`/users/${user.id}`, {formData, user}); // Sending to backend
     setIsSaved(true); // Successfully saved
     editPageOpen(false); // Close the edit page
   } catch (error) {
     console.error('Failed to update profile:', error);
   }
 };

// const handleSave = (setIsSaved) => { setIsSaved ? setIsSaved(false) : null };


  function Input(key_name) {
   return(
    <form onSubmit={handleSubmit} className="space-y-6">
     <input 
       name={key_name}
       value={user.key_name}
       onChange={handleChange}
       className="border rounded w-full p-2"
     />
    </form>
   );
   
  }

  function DisplayInputInfo(key_name) {
   return (
     <>
       {(editPageOpen && !isSaved) ? (
         user.key_name && 
         (key_name === "email" ? 
         <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">
          {user.email}
         </a>
        : <span>{user.key_name}</span>
       )) : (
         <Input name={key_name} />
       )}
     </>
   );
  }
 
  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Welcome Message */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">Welcome, {user.username}</h2>
        {!editPageOpen && (
        <Link 
         onclick={() => {setEditPageOpen(true); setIsSaved(false);}} 
         className="flex items-center text-gray-600 hover:text-blue-500"
        >
          <Pencil className="w-4 h-4 mr-1" />
          Manage Profile
        </Link>
        )}
      </div>

       {/* Basic Info */}
       <div className="border rounded-lg p-4 mb-6">
         <h3 className="font-semibold mb-4">Basic Info</h3>
         <div key="usename" className="flex justify-between py-2 border-b">
           <span className="text-gray-500">Username</span>
           <DisplayInputInfo name="username" />
         </div>
         <div key="gender" className="flex justify-between py-2">
           <span className="text-gray-500">Gender</span>
           <DisplayInputInfo name="gender" />
         </div>
       </div>

       {/* Contact Info */}
       <div className="border rounded-lg p-4 mb-6">
         <h3 className="font-semibold mb-4">Contact Info</h3>
         <div key="email" className="flex justify-between py-2 border-b">
           <span className="text-gray-500">Email</span>
           <DisplayInputInfo name="email" />
         </div>
         <div key="phone" className="flex justify-between py-2">
           <span className="text-gray-500">Phone</span>
           <DisplayInputInfo name="phone" />
         </div>
       </div>

       {/* Expertise Category */}
       <div className="border rounded-lg p-4">
         <h3 className="font-semibold mb-4">Expertise Category</h3>
         <div key="expertise" className="text-center text-gray-500">
           <DisplayInputInfo name="expertise" />
         </div>
       </div>

       {editPageOpen && (
       <button 
          onClick={handleSubmit} 
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
       >
          Save Changes
       </button>
       )}

       {/* Save Button */}
    </div>
      
  );
 
}

export default Profile;
