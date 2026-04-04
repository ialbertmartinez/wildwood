const fs = require('fs');
const path = require('path');

// --- SETTINGS ---
const templatePath = path.join(__dirname, 'master_template.html');
const horsesDir = path.resolve(__dirname, '../Horses'); 

// Helper function to turn "lucia-avicii-ww" into "Lucia Avicii WW"
function formatHorseName(folderName) {
    return folderName.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace(/Ww$/, 'WW'); // Keeps the WW capitalized if it's at the end
}

function buildHorsePages() {
    // 1. Load the master template
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');
    console.log("TEMPLATE READ CHECK:", templateHtml.substring(0, 150));
    console.log("Does it see the placeholder?", templateHtml.includes('{{CONTENT_HERE}}'));
    console.log("Does it see Armonn's name?", templateHtml.includes('Armonn WW'));
    // 2. Read the main Horses directory
    const horseFolders = fs.readdirSync(horsesDir).filter(f => fs.statSync(path.join(horsesDir, f)).isDirectory());

    let pagesCreated = 0;

    // 3. Loop through every horse folder
    for (const folder of horseFolders) {
        const currentHorseDir = path.join(horsesDir, folder);
        
        // Target the photos subfolder
        const photosDir = path.join(currentHorseDir, 'photos'); 
        
        if (!fs.existsSync(photosDir)) continue; // Skip if no photos folder exists

        // Get all images
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const files = fs.readdirSync(photosDir);
        const images = files.filter(file => validExtensions.includes(path.extname(file).toLowerCase()));

        if (images.length === 0) continue; // Skip if no images are found

        // 4. Build the HTML content for this specific horse
        const horseName = formatHorseName(folder);
        let imagesContent = '';
        console.log("horseName: ", horseName);
        images.forEach(img => {
            // Build the image tag string
            imagesContent += `<p align="center"><img src="${img}" width="500" style="height: auto;" class="image-border-3px"></p>\n<p align="center">&nbsp;</p>\n`;
        });

        // 5. Inject the content into the template's TWO placeholders
        let finalHtml = templateHtml.replace('{{CONTENT_HERE}}', horseName);
        finalHtml = finalHtml.replace('{{IMAGES_CONTENT_HERE}}', imagesContent);

        // 6. Save the new index.html file into the horse's photos folder
        const outputPath = path.join(photosDir, 'index.html');
        fs.writeFileSync(outputPath, finalHtml, 'utf-8');
        
        console.log(`Created page for: ${horseName} -> ${outputPath}`);
        pagesCreated++;
    }

    console.log(`\nAll done! Successfully generated ${pagesCreated} horse pages.`);
}

buildHorsePages();