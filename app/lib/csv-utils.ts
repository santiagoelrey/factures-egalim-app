import { DayData } from './types';

/**
 * Exports DayData invoices to a CSV file optimized for French Excel and accounting software.
 */
export function exportToCSV(data: DayData[], filename: string = 'export_egalim.csv') {
    // Headers matching the invoice structure
    const headers = [
        'Date_Jour',
        'Produit',
        'Quantite',
        'Prix_Unitaire_HT',
        'Total_HT',
        'TVA',
        'Total_TTC',
        'Est_Bio'
    ];

    const rows = [headers.join(';')];

    data.forEach(day => {
        day.ligne_facture.forEach(line => {
            const row = [
                `"${(day.jour || '').replace(/"/g, '""')}"`,
                `"${(line.produit || '').replace(/"/g, '""')}"`,
                line.quantite,
                line.prix_unitaire,
                line.total_ht,
                line.tva,
                line.ttc,
                line.est_bio ? 'Oui' : 'Non'
            ];
            rows.push(row.join(';'));
        });
    });

    // Add BOM (\uFEFF) for UTF-8 encoding detection in Excel (accented chars like é, à, etc.)
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
