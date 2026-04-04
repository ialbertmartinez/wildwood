const fs = require('fs');
const cheerio = require('cheerio');

function convertSalesPage(inputFile, outputFile) {
    // Read the original HTML file
    const html = fs.readFileSync(inputFile, 'utf-8');
    
    // Load it into Cheerio (decodeEntities: false keeps your &nbsp; and special characters intact)
    const $ = cheerio.load(html, { decodeEntities: false }); 
    let convertedCount = 0;

    // Find every table on the page
    $('table').each((i, table) => {
        const $table = $(table);
        
        // Look for the specific columns that identify a horse listing
        const $tdLeft = $table.find('td[width="36%"]');
        const $tdRight = $table.find('td[width="60%"]');

        // If the table has those exact columns, we know it's a horse!
        if ($tdLeft.length > 0 && $tdRight.length > 0) {
            // Extract the raw HTML inside those columns
            const imageContent = $tdLeft.html().trim();
            const textContent = $tdRight.html().trim();

            // Build the new modern structure
            const newStructure = `
<div class="horse-listing">
    <div class="horse-image">
        ${imageContent}
    </div>
    
    <div class="horse-details">
        ${textContent}
    </div>
</div>\n`;

            // Replace the old table with the new div structure
            $table.replaceWith(newStructure);
            convertedCount++;
        }
    });

    // Remove the old `<p class="news-spacing">&nbsp;</p>` tags 
    // since our CSS margin-bottom will handle the spacing now!
    $('p.news-spacing').remove();

    // Save the completely updated HTML into a new file
    fs.writeFileSync(outputFile, $.html(), 'utf-8');
    
    console.log(`\nSuccess! Converted ${convertedCount} horse listings.`);
    console.log(`Saved the modern layout to: ${outputFile}\n`);
}

// --- SET YOUR VARIABLES HERE ---
const inputHtmlFile = 'index.html';         // Replace with the name of your sales page
const outputHtmlFile = 'sales_modern.html'; // The new file it will generate

convertSalesPage(inputHtmlFile, outputHtmlFile);