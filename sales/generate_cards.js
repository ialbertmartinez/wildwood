const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function convertToCards(inputFile, outputFile) {
    const html = fs.readFileSync(inputFile, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false }); 
    let convertedCount = 0;

    // Create the wrapper for the grid
    const $gridWrapper = $('<div class="horse-card-grid"></div>');

    $('table').each((i, table) => {
        const $table = $(table);
        const $tdLeft = $table.find('td[width="36%"]');
        const $tdRight = $table.find('td[width="60%"]');

        if ($tdLeft.length > 0 && $tdRight.length > 0) {
            // 1. Extract Image
            const imgSrc = $tdLeft.find('img').attr('src') || '';
            
            // 2. Extract Name
            const name = $tdRight.find('h3').text().trim() || $tdRight.find('strong').first().text().trim();
            
            // Try to figure out the horse's folder name from the image path (e.g., "../horses/gionni-ww/photos/...")
            let horseFolder = '';
            if (imgSrc.includes('/horses/')) {
                const parts = imgSrc.split('/');
                const horseIndex = parts.indexOf('horses') + 1;
                if (parts[horseIndex]) horseFolder = parts[horseIndex];
            }

            // 3. Extract Lineage and Stats (usually in the first paragraph)
            const $paragraphs = $tdRight.find('p');
            const firstParaHtml = $paragraphs.eq(0).html() || '';
            const lines = firstParaHtml.split(/<br\s*\/?>/i).map(l => l.replace(/<[^>]+>/g, '').trim()).filter(l => l);
            
            const lineage = lines[0] || '';
            const statsString = lines[1] || ''; // e.g., "2025 Chestnut Colt"
            
            // Break stats down into individual tags
            const statsArray = statsString.split(' ').filter(s => s.trim() !== '');
            const tagsHtml = statsArray.map(stat => `<span class="tag">${stat}</span>`).join('');

            // 4. Extract the Story (middle paragraphs)
            let storyHtml = '';
            // We skip the first paragraph (stats) and the last paragraph (links)
            for (let j = 1; j < $paragraphs.length - 1; j++) {
                storyHtml += `<p>${$paragraphs.eq(j).html().replace(/<br\s*\/?>/ig, '')}</p>\n`;
            }

            // 5. Extract Old Links (Pedigree, Video)
            const lastParaHtml = $paragraphs.last().html() || '';
            const $links = cheerio.load(lastParaHtml);
            let pedigreeLink = '#';
            let videoLink = '#';
            
            $links('a').each((idx, a) => {
                const text = $links(a).text().toLowerCase();
                const href = $links(a).attr('href');
                if (text.includes('pedigree')) pedigreeLink = href;
                if (text.includes('video')) videoLink = href;
            });

            // --- BUILD THE NEW STORY PAGE ---
            if (horseFolder) {
                const storyPath = path.resolve(__dirname, `../Horses/${horseFolder}/story.html`);
                // A very basic HTML wrapper for the story - you can link this to your master template later!
                const fullStoryPage = `
<!DOCTYPE html>
<html>
<head>
    <title>${name} - Our Story</title>
    <link href="../../../styles.css" rel="stylesheet" type="text/css">
</head>
<body>
    <div id="content-box">
        <div id="content" style="padding: 40px; background: #fff; border-radius: 8px;">
            <h1>The Story of ${name}</h1>
            <p><em>${lineage}</em></p>
            <hr style="margin: 20px 0;">
            ${storyHtml}
            <br>
            <a href="../../../sales/index.html" class="btn btn-primary">Back to Sales</a>
        </div>
    </div>
</body>
</html>`;
                // Only create the story file if the directory exists
                const horseDir = path.resolve(__dirname, `../Horses/${horseFolder}`);
                if (fs.existsSync(horseDir)) {
                    fs.writeFileSync(storyPath, fullStoryPage.trim(), 'utf-8');
                }
            }

            // --- BUILD THE NEW CARD ---
            const newCard = `
<div class="horse-card">
    <div class="card-image-wrapper">
        <img src="${imgSrc}" alt="${name}">
    </div>
    
    <div class="card-info">
        <h3>${name}</h3>
        <p class="lineage">${lineage}</p>
        
        <div class="horse-tags">
            ${tagsHtml}
        </div>
        
        <div class="card-actions">
            ${storyHtml.trim() ? `<a href="../horses/${horseFolder}/story.html" class="btn btn-primary">Story</a>` : ''}
            <a href="${pedigreeLink}" class="btn btn-secondary">Pedigree</a>
            <a href="../horses/${horseFolder}/photos/" class="btn btn-secondary">Photos</a>
            ${videoLink !== '#' ? `<a href="${videoLink}" target="_blank" class="btn btn-video">Video</a>` : ''}
        </div>
    </div>
</div>`;

            // Add the card to our grid
            $gridWrapper.append(newCard);
            
            // Remove the old table
            $table.remove();
            convertedCount++;
        }
    });

    // Clean up empty spacing paragraphs
    $('p.news-spacing').remove();

    // Insert the new grid where the first table used to be
    $('#content').append($gridWrapper);

    // Save the new file
    fs.writeFileSync(outputFile, $.html(), 'utf-8');
    
    console.log(`\nMagic complete! Converted ${convertedCount} horses to cards.`);
    console.log(`Saved the new modern layout to: ${outputFile}\n`);
}

// Run it!
const inputHtmlFile = 'old-index.html';         // Change to your actual sales file name if different
const outputHtmlFile = 'sales_modern_cards.html'; 

convertToCards(inputHtmlFile, outputHtmlFile);