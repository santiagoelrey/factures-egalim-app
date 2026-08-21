const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const regex = /const handleImageUpload = \(e: React\.ChangeEvent<HTMLInputElement>\) => {[\s\S]*?reader\.readAsDataURL\(file\);\s*}\s*};/;

const replacement = `const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setSelectedImage(compressedBase64);
        setData(null);
        setSyncStatus(null);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Erreur lors du traitement de l'image.");
      }
    }
  };`;

if(regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('app/page.tsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Regex did not match');
}
