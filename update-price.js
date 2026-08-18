const fs = require('fs');
let content = fs.readFileSync('app/menu/page.tsx', 'utf8');

// 1. Add prix_unitaire to RecipeIngredient
content = content.replace(/unite\?: 'kilo' \| 'pièce';/, `unite?: 'kilo' | 'pièce';\n  prix_unitaire?: number;`);

// 2. Use prix_unitaire in calculation
content = content.replace(/const price = getProductUnitPrice\(ing\.produit\);/, `const price = ing.prix_unitaire !== undefined ? ing.prix_unitaire : getProductUnitPrice(ing.produit);`);

// 3. Update handleAddFicheIngredient
content = content.replace(
`  const handleAddFicheIngredient = (
    productName: string, 
    customBio?: boolean, 
    customLabel?: string, 
    customUnit?: 'kilo' | 'pièce'
  ) => {`, 
`  const handleAddFicheIngredient = (
    productName: string, 
    customBio?: boolean, 
    customLabel?: string, 
    customUnit?: 'kilo' | 'pièce',
    customPrice?: number
  ) => {`
);

content = content.replace(
`    editingFiche.ingredients.push({
      produit: productName,
      quantiteBase: 1,
      est_bio: isBio,
      label: label,
      unite: unit
    });`, 
`    editingFiche.ingredients.push({
      produit: productName,
      quantiteBase: 1,
      est_bio: isBio,
      label: label,
      unite: unit,
      prix_unitaire: customPrice
    });
    
    // Save to history if custom price provided
    if (customPrice !== undefined) {
      try {
        const historyStr = localStorage.getItem('egalim_invoice_history_v1');
        const history = historyStr ? JSON.parse(historyStr) : [];
        if (Array.isArray(history)) {
          history.push({
            id: \`history-custom-\${crypto.randomUUID()}\`,
            produit: productName,
            prix_unitaire: customPrice,
            quantite: 0,
            total_ht: 0,
            est_bio: isBio,
            label: label
          });
          localStorage.setItem('egalim_invoice_history_v1', JSON.stringify(history));
        }
      } catch (e) {}
    }`
);

// 4. Update the input in the recipe ingredient loop to edit price
content = content.replace(
`                          <select
                            value={ing.unite || 'kilo'}
                            onChange={(e) => {
                              editingFiche.ingredients[idx].unite = e.target.value as 'kilo' | 'pièce';
                              setEditingFiche({ ...editingFiche });
                            }}
                            className="bg-gray-50 border border-gray-200 rounded text-[9px] py-0.5 px-1 focus:outline-none font-semibold text-gray-600"
                          >
                            <option value="kilo">kg</option>
                            <option value="pièce">pc</option>
                          </select>

                          <button onClick={() => handleRemoveFicheIngredient(idx)} className="p-0.5 text-red-500 hover:bg-red-50 rounded">`,
`                          <select
                            value={ing.unite || 'kilo'}
                            onChange={(e) => {
                              editingFiche.ingredients[idx].unite = e.target.value as 'kilo' | 'pièce';
                              setEditingFiche({ ...editingFiche });
                            }}
                            className="bg-gray-50 border border-gray-200 rounded text-[9px] py-0.5 px-1 focus:outline-none font-semibold text-gray-600"
                          >
                            <option value="kilo">kg</option>
                            <option value="pièce">pc</option>
                          </select>

                          <input
                            type="number"
                            step="0.01"
                            placeholder="Prix u. (€)"
                            value={ing.prix_unitaire !== undefined ? ing.prix_unitaire : ''}
                            onChange={(e) => {
                              editingFiche.ingredients[idx].prix_unitaire = e.target.value ? parseFloat(e.target.value) : undefined;
                              setEditingFiche({ ...editingFiche });
                            }}
                            className="w-16 bg-gray-50 border border-gray-200 rounded text-[9px] py-0.5 px-1 focus:outline-none font-semibold text-gray-600"
                          />

                          <button onClick={() => handleRemoveFicheIngredient(idx)} className="p-0.5 text-red-500 hover:bg-red-50 rounded">`
);

// 5. Update the manual add form for the fiche to include price
content = content.replace(
`                            <select
                              id="manual-fiche-unite"
                              className="w-1/2 bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-700"
                            >
                              <option value="kilo">Kilo (kg)</option>
                              <option value="pièce">Pièce (pc)</option>
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              const selectEl = document.getElementById('manual-fiche-label') as HTMLSelectElement;
                              const selectUnit = document.getElementById('manual-fiche-unite') as HTMLSelectElement;
                              const customLabel = selectEl ? selectEl.value : 'STANDARD';
                              const customUnit = selectUnit ? selectUnit.value as 'kilo' | 'pièce' : 'kilo';
                              handleAddFicheIngredient(searchTerm.trim(), customLabel === 'BIO', customLabel, customUnit);
                              setSearchTerm('');
                            }}`,
`                            <select
                              id="manual-fiche-unite"
                              className="w-1/2 bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-700"
                            >
                              <option value="kilo">Kilo (kg)</option>
                              <option value="pièce">Pièce (pc)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-gray-400 block uppercase">Prix unitaire (€)</label>
                            <input
                              id="manual-fiche-price"
                              type="number"
                              step="0.01"
                              placeholder="ex: 3.50 (facultatif)"
                              className="w-full bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-750"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const selectEl = document.getElementById('manual-fiche-label') as HTMLSelectElement;
                              const selectUnit = document.getElementById('manual-fiche-unite') as HTMLSelectElement;
                              const priceEl = document.getElementById('manual-fiche-price') as HTMLInputElement;
                              const customLabel = selectEl ? selectEl.value : 'STANDARD';
                              const customUnit = selectUnit ? selectUnit.value as 'kilo' | 'pièce' : 'kilo';
                              const customPrice = priceEl && priceEl.value ? parseFloat(priceEl.value) : undefined;
                              handleAddFicheIngredient(searchTerm.trim(), customLabel === 'BIO', customLabel, customUnit, customPrice);
                              setSearchTerm('');
                            }}`
);

fs.writeFileSync('app/menu/page.tsx', content);
console.log('Modifications effectuées avec succès.');
