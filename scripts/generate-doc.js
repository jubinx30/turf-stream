const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, UnderlineType } = require('docx');

async function generateDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22, // 11pt
            color: '111827',
          },
          paragraph: {
            spacing: {
              line: 300, // 1.25x line spacing
              after: 160,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Document Title
          new Paragraph({
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: 'Turf Live',
                size: 48, // 24pt
                font: 'Arial',
                color: '111827',
              }),
            ],
          }),

          // Overview Heading
          new Paragraph({
            spacing: { before: 200, after: 180 },
            children: [
              new TextRun({
                text: 'Overview',
                size: 36, // 18pt
                font: 'Arial',
                color: '111827',
              }),
            ],
          }),

          // Overview Text
          new Paragraph({
            spacing: { after: 320, line: 300 },
            children: [
              new TextRun({
                text:
                  'Broadcasting amateur sports and managing grassroots athletic venues poses significant technical and commercial hurdles on conventional video platforms. Mainstream streaming platforms require expensive proprietary cameras, charge recurring broadcast fees, or lock live matches behind cumbersome account registration walls, leaving local turf operators, players, and families underserved. Spectators frequently struggle to view live matches without friction, while venue managers miss out on lucrative post-match replay monetization and simple camera setup options. Additionally, evaluating multi-turf availability from afar and navigating complex video ingestion pipelines create persistent operational friction. Turf Live solves these challenges by delivering a dedicated, camera-agnostic live streaming and monetization platform tailored exclusively to sports turfs, athletic arenas, and local tournament facilities.',
                size: 22, // 11pt
                font: 'Arial',
                color: '1F2937',
              }),
            ],
          }),

          // Key Features Heading
          new Paragraph({
            spacing: { before: 240, after: 180 },
            children: [
              new TextRun({
                text: 'Key Features of the App',
                size: 36, // 18pt
                font: 'Arial',
                color: '111827',
              }),
            ],
          }),

          // Feature 1
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 140, line: 280 },
            children: [
              new TextRun({
                text: 'Interactive Geospatial Turf Mapping: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Browse arenas and turf grounds visually with dynamic live status indicators, interactive map markers, and GPS geolocation. Switching across venues provides an eagle’s eye view of match action and facilities.',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Feature 2
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 140, line: 280 },
            children: [
              new TextRun({
                text: 'Frictionless Public Live Feed: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Watch high-definition, low-latency HLS match broadcasts instantly directly in the browser with zero mandatory account registration or upfront barriers.',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Feature 3
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 140, line: 280 },
            children: [
              new TextRun({
                text: 'Automated 2-Hour Replay Paywall: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Stream and download match recordings for free within a 2-hour post-match grace period, seamlessly converting older sessions to paid access via Single Match Passes ($1.99) or All-Access Subscriptions ($9.99/mo).',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Feature 4
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 140, line: 280 },
            children: [
              new TextRun({
                text: 'Camera & Hardware Agnosticism: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Connect any camera hardware without custom software—turn everyday Android phones, PoE IP cameras (Hikvision/Dahua), Raspberry Pi 3 setups, or action cams (GoPro RTMP) into automated broadcast hubs.',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Feature 5
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 140, line: 280 },
            children: [
              new TextRun({
                text: 'Turf Directory & Multi-Sport Filtering: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Filter athletic grounds by sport type, amenities (floodlights, changing rooms, turf condition), operational hours, and active live stream availability.',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Feature 6
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 140, line: 280 },
            children: [
              new TextRun({
                text: 'Integrated Turf Slot Booking: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Reserve match slots, schedule team games, and verify court availability with instant confirmation modals and automated fixture scheduling.',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Feature 7
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 140, line: 280 },
            children: [
              new TextRun({
                text: 'Direct Venue Inquiries & Support: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Contact facility managers directly through quick communication channels for private tournament hosting, coaching bookings, and field rental guidance.',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Feature 8
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 280, line: 280 },
            children: [
              new TextRun({
                text: 'Secure Media Downloads & Replays: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new TextRun({
                text:
                  'Download verified, high-bitrate match videos with token-gated security headers and chunked HTTP range streaming to prevent unauthorized distribution.',
                font: 'Arial',
                size: 22,
              }),
            ],
          }),

          // Footer App Link
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: 'Mobile & Web App Link: ',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
              new ExternalHyperlink({
                children: [
                  new TextRun({
                    text: 'http://localhost:4000',
                    font: 'Arial',
                    size: 22,
                    color: '2563EB',
                    underline: {
                      type: UnderlineType.SINGLE,
                    },
                  }),
                ],
                link: 'http://localhost:4000',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'Turf_Live_Project_Overview.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Generated DOCX at:', outputPath);
}

generateDocx().catch((err) => {
  console.error(err);
  process.exit(1);
});

