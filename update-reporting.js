const fs = require('fs');
let content = fs.readFileSync('app/reporting/page.tsx', 'utf8');

// Add new imports for Loader2 and FileText
content = content.replace(
  "Trash2, RefreshCw, ChevronRight, Award, CheckCircle, ShieldAlert",
  "Trash2, RefreshCw, ChevronRight, Award, CheckCircle, ShieldAlert, Loader2, FileText, X"
);

// Add state variables
content = content.replace(
  "const [timeFilter, setTimeFilter] = useState<'ALL' | 'MONTH' | 'YEAR'>('ALL');",
  `const [timeFilter, setTimeFilter] = useState<'ALL' | 'MONTH' | 'YEAR'>('ALL');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);`
);

// Add generate report function
const functionToInsert = `
  const generateOfficialReport = async () => {
    setReportGenerating(true);
    setReportContent(null);
    try {
      const response = await fetch('/api/gemini-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: {
            totalPurchases,
            totalEgalim,
            totalBio,
            egalimPercent,
            bioPercent,
            labelBreakdown
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur inconnue");
      setReportContent(data.report);
    } catch (err: any) {
      alert("Impossible de générer le rapport: " + err.message);
    } finally {
      setReportGenerating(false);
    }
  };
`;

content = content.replace(
  "// Calculate stats",
  functionToInsert + "\n  // Calculate stats"
);

// Add button in header
content = content.replace(
  `          <button
            onClick={handleClearHistory}`,
  `          <button
            onClick={generateOfficialReport}
            disabled={reportGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            title="Générer un Rapport Officiel avec Gemini"
          >
            {reportGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span className="hidden sm:inline">Rapport Officiel</span>
          </button>
          
          <button
            onClick={handleClearHistory}`
);

// Add Modal at the end of the return
const modalHtml = `
      {/* Report Modal */}
      {reportContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Rapport Officiel de Cuisine (IA Gemini)
              </h2>
              <button 
                onClick={() => setReportContent(null)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 prose prose-sm max-w-none prose-indigo">
              {reportContent.split('\\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-2">{line.replace(/\\*\\*/g, '')}</p>;
                if (line.trim() === '') return <br key={i} />;
                // Handle bold inline
                const formattedLine = line.split(/(\\*\\*.*?\\*\\*)/g).map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });
                return <p key={i} className="my-2 leading-relaxed text-gray-700">{formattedLine}</p>;
              })}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setReportContent(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace("    </div>\n  );\n}", modalHtml + "    </div>\n  );\n}");

fs.writeFileSync('app/reporting/page.tsx', content);
console.log('Reporting page updated successfully!');
