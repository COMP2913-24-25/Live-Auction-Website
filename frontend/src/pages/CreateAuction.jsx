import { useState } from 'react';
import axios from 'axios';

export default function CreateAuction() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingPrice, setStartingPrice] = useState('');

    // Handle price input change
    const handlePriceChange = (e) => {
        const value = e.target.value;
        setStartingPrice(value);
    };

    return (
        <form className="space-y-6 max-w-2xl mx-auto p-4">
            {/* ...existing form fields... */}

            {/* Starting Price Input */}
            <div className="space-y-2">
                <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700">
                    Starting Price (£)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">£</span>
                    </div>
                    <input
                        type="number"
                        id="startingPrice"
                        value={startingPrice}
                        onChange={handlePriceChange}
                        className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
            </div>

            {/* ...existing form fields and submit button... */}
        </form>
    );
}