import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import countriesData from '../data/countries.json';

export const initializeCountriesCatalog = async () => {
  console.log('Initializing countries catalog...');
  
  try {
    for (const country of countriesData) {
      const countryRef = doc(db, 'catalog', 'countries', country.iso2);
      await setDoc(countryRef, country);
      console.log(`Added ${country.name} (${country.iso2})`);
    }
    
    console.log(`Successfully initialized ${countriesData.length} countries`);
  } catch (error) {
    console.error('Error initializing countries:', error);
    throw error;
  }
};

// Run this function once to populate Firestore
// initializeCountriesCatalog();