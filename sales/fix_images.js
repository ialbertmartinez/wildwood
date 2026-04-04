const fs = require('fs');
const path = require('path');

function generateImageGallery(searchDir, outputFile) {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    let htmlContent = [];
    const outputDir = path.dirname(outputFile) || '.';

    // Recursive function to dig through folders
    function walkDir(currentDir) {
        const files = fs.readdirSync(currentDir);
        
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walkDir(fullPath); // If it's a folder, dig deeper
            } else {
                const ext = path.extname(file).toLowerCase();
                
                if (validExtensions.includes(ext)) {
                    // Calculate the relative path
                    let relPath = path.relative(outputDir, fullPath);
                    // Convert Windows backslashes to web-safe forward slashes
                    relPath = relPath.split(path.sep).join('/'); 
                    
                    // Build the HTML snippet with width="500" and style="height: auto;"
                    const snippet = `<p align="center"><img src="${relPath}" width="500" style="height: auto;" class="image-border-3px"></p>\n<p align="center">&nbsp;</p>`;
                    htmlContent.push(snippet);
                }
            }
        }
    }

    walkDir(searchDir);

    // Write everything to the new HTML file
    fs.writeFileSync(outputFile, htmlContent.join('\n'), 'utf-8');
    console.log(`Success! Generated HTML for ${htmlContent.length} images in '${outputFile}'.`);
}

// --- SET YOUR VARIABLES HERE ---
const folderToSearch = '../horses';       // The root folder to search inside
const outputHtmlFile = 'image_list.html'; // The file this script will create

generateImageGallery(folderToSearch, outputHtmlFile);