const fs = require('fs');
let content = fs.readFileSync('app/stock/page.tsx', 'utf8');

// Replace the JSX for the "Prix U." column cell
content = content.replace(
`<td className="px-6 py-4 text-right text-gray-600">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={item.prix_unitaire}
                                                onChange={(e) => {
                                                    const price = parseFloat(e.target.value) || 0;
                                                    setStock(prev => prev.map(si => si.id === item.id ? { ...si, prix_unitaire: price } : si));
                                                }}
                                                className="w-20 text-right bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 focus:outline-none"
                                            /> €
                                        </td>`,
`<td className="px-6 py-4 text-right text-gray-600">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        value={item.prix_unitaire}
                                                        onChange={(e) => {
                                                            const price = parseFloat(e.target.value) || 0;
                                                            setStock(prev => prev.map(si => si.id === item.id ? { ...si, prix_unitaire: price } : si));
                                                        }}
                                                        className="w-20 text-right bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 focus:outline-none font-medium text-gray-900"
                                                    /> €
                                                </div>
                                                {item.ancien_prix_unitaire !== undefined && item.ancien_prix_unitaire > 0 && item.ancien_prix_unitaire !== item.prix_unitaire && (
                                                    <div className={\`text-[10px] flex items-center gap-0.5 font-bold \${item.prix_unitaire > item.ancien_prix_unitaire ? 'text-red-500' : 'text-green-500'}\`}>
                                                        {item.prix_unitaire > item.ancien_prix_unitaire ? '🔺' : '🔻'}
                                                        {Math.abs(((item.prix_unitaire - item.ancien_prix_unitaire) / item.ancien_prix_unitaire) * 100).toFixed(1)}%
                                                        <span className="text-gray-400 font-normal ml-1">(anc: {item.ancien_prix_unitaire.toFixed(2)}€)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>`
);

fs.writeFileSync('app/stock/page.tsx', content);
console.log('Update stock page complete.');
