import { supabase } from '../lib/supabase';
import Papa from 'papaparse';

const importClients = async () => {
  try {
    // Read the CSV file
    const fileContent = await window.fs.readFile('Filtered_Company_Data__Cleaned_.csv', { encoding: 'utf8' });
    
    // Parse CSV
    const results = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    // Transform data for insertion
    const clients = results.data.map((row: any) => ({
      id: parseInt(row.CompanyID),
      name: row.CompanyName
    }));

    // Insert into Supabase
    const { error } = await supabase
      .from('clients')
      .upsert(clients, { 
        onConflict: 'id'
      });

    if (error) {
      console.error('Error importing clients:', error);
      throw error;
    }
    
    console.log('Successfully imported clients');
  } catch (error) {
    console.error('Error:', error);
  }
};

export default importClients;