const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Recursive function to find a file inside a directory
function findFile(filename, dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const result = findFile(filename, fullPath);
            if (result) return result;
        } else if (file === filename) {
            return fullPath;
        }
    }
    return null;
}

function fixBrokenImages(htmlFilePath, searchDirectory) {
    // Read and parse the HTML
    const html = fs.readFileSync(htmlFilePath, 'utf-8');
    const $ = cheerio.load(html);
    let changesMade = 0;

    // Loop through all image tags
    $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        if (!src) return;

        // Determine absolute path to check if file exists
        const absoluteSrc = path.resolve(path.dirname(htmlFilePath), src);

        // If the file path is broken...
        if (!fs.existsSync(absoluteSrc)) {
            const filename = path.basename(src); // Extract filename
            
            // Search the directory for the missing file
            const newFilePath = findFile(filename, searchDirectory);

            if (newFilePath) {
                // Calculate new relative path for the HTML file
                let newRelativePath = path.relative(path.dirname(htmlFilePath), newFilePath);
                
                // Convert Windows backslashes to web-safe forward slashes
                newRelativePath = newRelativePath.split(path.sep).join('/');
                
                $(elem).attr('src', newRelativePath);
                changesMade++;
                console.log(`Fixed: ${src} -> ${newRelativePath}`);
            } else {
                console.log(`Image not found anywhere: ${filename}`);
            }
        }
    });

    // Save the updated HTML
    if (changesMade > 0) {
        fs.writeFileSync(htmlFilePath, $.html(), 'utf-8');
        console.log(`\nSuccess! Updated ${changesMade} image paths in ${htmlFilePath}.`);
    } else {
        console.log('\nNo broken links needed fixing or missing images couldn\'t be found.');
    }
}

// --- SET YOUR VARIABLES HERE ---
const htmlFileToCheck = 'index.html'; // Change this to your HTML file name
const folderToSearch = path.resolve(__dirname, '../horses'); // The folder containing your images

fixBrokenImages(htmlFileToCheck, folderToSearch);