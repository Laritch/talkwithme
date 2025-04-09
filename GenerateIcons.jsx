// This is a utility component to generate SVG versions of our icons
// In a real-world scenario, you would use a tool like Real Favicon Generator
// or Adobe Illustrator to create proper icon sets

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#2c3e50"/>
  <path d="M110 180C110 140 142 110 180 110H332C370 110 402 140 402 180V224C402 264 370 294 332 294H200L145 349V294H110C90 294 70 273 70 253V180C70 140 90 110 130 110H265" stroke="#ffffff" stroke-width="22" fill="none"/>
  <circle cx="162" cy="202" r="15" fill="#ffffff"/>
  <circle cx="256" cy="202" r="15" fill="#ffffff"/>
  <circle cx="350" cy="202" r="15" fill="#ffffff"/>
</svg>
`;

// In a production environment, you would actually save this SVG to disk
// Then convert it to various PNG sizes
// For the sake of this demo, we'll just provide the code

export default function GenerateIcons() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Chat Icon Generator</h1>
      <p>This component would be used in a build step to generate the different icon sizes for the PWA.</p>
      <p>In a real project, we would use a proper image processing library to convert this SVG to different PNG sizes.</p>

      <h2>Preview:</h2>
      <div dangerouslySetInnerHTML={{ __html: iconSvg }} style={{ width: '128px', height: '128px' }} />

      <h2>SVG Code:</h2>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px', overflow: 'auto' }}>
        {iconSvg}
      </pre>

      <p>The next step would be generating the following sizes:</p>
      <ul>
        <li>icon-72x72.png</li>
        <li>icon-96x96.png</li>
        <li>icon-128x128.png</li>
        <li>icon-144x144.png</li>
        <li>icon-152x152.png</li>
        <li>icon-192x192.png</li>
        <li>icon-384x384.png</li>
        <li>icon-512x512.png</li>
        <li>maskable-icon-512x512.png (with padding for maskable icon format)</li>
      </ul>
    </div>
  );
}
