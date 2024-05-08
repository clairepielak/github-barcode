import {
  Camera,
  CameraSwitchControl,
  DataCaptureContext,
  DataCaptureView,
  FrameSourceState,
  configure,
  resetConfigure,
} from 'scandit-web-datacapture-core';
import {
  BarcodeTrackingSession,
  SymbologySettings,
  TrackedBarcode,
} from 'scandit-web-datacapture-barcode';
import {
  BarcodeTracking,
  BarcodeTrackingBasicOverlay,
  BarcodeTrackingBasicOverlayStyle,
  BarcodeTrackingScenario,
  BarcodeTrackingSettings,
  Symbology,
  SymbologyDescription,
  barcodeCaptureLoader,
} from 'scandit-web-datacapture-barcode';

import { SdcUiButton } from './components/sdcUiButton';
import { SdcUiDrawerBottom } from './components/sdcUiDrawerBottom';
import {
  SdcUiBarcodeList,
  SdcUiBarcodeListItem,
} from './components/sdcUiBarcodeList';
import { define, removeAllChildNodes } from './utils';
let barcodeTracking: BarcodeTracking | null = null;
async function run(): Promise<void> {
  define({
    'sdc-ui-button': SdcUiButton,
    'sdc-ui-drawer-bottom': SdcUiDrawerBottom,
    'sdc-ui-barcode-list': SdcUiBarcodeList,
    'sdc-ui-barcode-list-item': SdcUiBarcodeListItem,
  });
  document.body.classList.add('componentsDefined');

  // To visualize the ongoing loading process on screen, the view must be connected before the configure phase.
  const view: DataCaptureView = new DataCaptureView();

  // Connect the data capture view to the HTML element.
  view.connectToElement(document.getElementById('data-capture-view')!);

  // Show the loading layer
  view.showProgressBar();

  await configure({
    licenseKey:
      'AjlkKjb0EoSVLzVhEQ4v9LMas3wxAyHtPyKPQiFB0ScNfqHGvm0N86EbFY0OH90MmGOBTeNhm/LuZc2B4k2/4T9QNFYVclTrv2s2++sICUb0ROSRhh7GDRIo85nocDo8C2uJb8dWW1usbvWg7lCZyhtY+/JXE7KTcGG/yd9rDUCLZ01JFVkEsFhEe/wcamn9Tn7ZP1hisSZJZeO35Uus1KluqK/TZYBa6HDBRDhFqq50Ro5fBmG/7B5LtExNc6Yedk00YR91xwV8QRfdf0o47Z9NIHvBb3n2bEcG8WF+f0k6Ufma2FwR2HR53zjrZaTN0ENhELx7mhBUbvHeSED0ki50g6vkFhslP3Uf1OFIQx6BEbxeuitHubZypZZ0Su2D1wSlx7Fq8wcqJQhFRmycMLV0J6ffaLAB+HI4Pc5jzqfaRRhFi0uIJV5X2GenYwJBhmnJwVlGAqEMQm4lKB7tm2NrBrlaDp1OixTDk89AcsjYTXc+fWigTVUn53IkYoFGckslAQJNChj8UX0qC2bdYA8YQgDpDwjLARs2V7g9vQFbaMDYmPtt9SW7Pf4lvZ8rypZhpHTYmibuZJ/duGoM1E4PFOeRVbif3OomziDNuKcjnQo2BJvNWzh0LzUIVtr3LD1vto7gvWLUh+720dkHDTdYlJ7EmzYHeBaA9rUQ2vtuMg1WRlvT65RgOOlQz/bQ3JOv6FM/6HTHECh9agiE9RUEKBApmgu0X+qyiET2jq23w6NjB1tMYkHigHtD34TWWws57kc8hKs6iy68uG18QXcTMnSgYl7S1j+5bjFLdaQxcA94WaHzlFJWXoZkWowYRboGOO+a0T0byVHz0vz+vGbWtca1d28npY/nv0v/oC4vwmYHJ2ZGMwTEGUe4d4LqdPaWCrFsdbqPY5yn1nt7cnIowa4P70Z0eqd1Ih4XytBJSs7ZF2gM+8hMGabrdfvzki8BuJXCBGIIfz8sMpPjF6qNZhcXwYhsfOoe/SDlB8KIrrEiDr+4q6jz2QPSI2mhBZireGxk4cSZfzulQdMCIoDQukVEeQyjVpixIRRKUC2E5qavk7+Tv2Trk7Z3u/pQ8G7hBD3o3bKnQgkr31Dr4O3NzAmk14YvRyKP98cvCOrPWvBsdLLrwc0uefGLYbgIxlks7egWQYvgqZWH8vG72B/PQyG5pJByU/M5ayhuJVvU+wyDq3LagfIMUukYE0KczL58rwa1',
    libraryLocation: new URL('library/engine/', document.baseURI).toString(),
    moduleLoaders: [barcodeCaptureLoader({ highEndBlurryRecognition: true })],
  });

  // Set the progress bar to be in an indeterminate state
  view.setProgressBarPercentage(null);
  view.setProgressBarMessage('Accessing Camera...');

  // Create the data capture context.
  const context: DataCaptureContext = await DataCaptureContext.create();

  // To visualize the ongoing barcode capturing process on screen, set up a data capture view that renders the
  // camera preview. The view must be connected to the data capture context.
  await view.setContext(context);

  const camera: Camera = Camera.default;
  const cameraSettings = BarcodeTracking.recommendedCameraSettings;
  await camera.applySettings(cameraSettings);
  await context.setFrameSource(camera);

  // The barcode tracking process is configured through barcode tracking settings,
  // they are then applied to the barcode tracking instance that manages barcode recognition.
  const settings: BarcodeTrackingSettings = BarcodeTrackingSettings.forScenario(
    BarcodeTrackingScenario.A
  );

  settings.enableSymbologies([
    //only really need code 39
    Symbology.DataMatrix,
    Symbology.Code39,
    Symbology.Code128,
    Symbology.InterleavedTwoOfFive,
  ]);

  // Create a new barcode tracking mode with the settings from above.
  const barcodeTracking = await BarcodeTracking.forContext(context, settings);
  // Disable the barcode tracking mode until the camera is accessed.
  await barcodeTracking.setEnabled(true);

  let trackedBarcodes: Record<string, TrackedBarcode>;
  // Register a listener to get updates about tracked barcodes.
  barcodeTracking.addListener({
    didUpdateSession: (
      barcodeTrackingMode: BarcodeTracking,
      session: BarcodeTrackingSession
    ) => {
      trackedBarcodes = session.trackedBarcodes;
    },
  });

  // Add a control to be able to switch cameras.
  view.addControl(new CameraSwitchControl());

  // Add a barcode tracking overlay to the data capture view to render the location of tracked barcodes on top of
  // the video preview. This is optional, but recommended for better visual feedback.
  await BarcodeTrackingBasicOverlay.withBarcodeTrackingForViewWithStyle(
    barcodeTracking,
    view,
    BarcodeTrackingBasicOverlayStyle.Frame
  );

  // Switch the camera on to start streaming frames.
  // The camera is started asynchronously and will take some time to completely turn on.
  await camera.switchToDesiredState(FrameSourceState.On);
  await barcodeTracking.setEnabled(true);
  view.hideProgressBar();

  const doneButton = document.getElementById('doneButton');
  const drawer = document.querySelector<SdcUiDrawerBottom>(
    'sdc-ui-drawer-bottom'
  )!;
  const continueButton = drawer.querySelector('sdc-ui-button')!;
  const list = drawer.querySelector('sdc-ui-barcode-list')!;

  // Register a listener to get updates about tracked barcodes.
  barcodeTracking.addListener({
    didUpdateSession: (
      barcodeTrackingMode: BarcodeTracking,
      session: BarcodeTrackingSession
    ) => {
      trackedBarcodes = session.trackedBarcodes;

      // Initialize flags to check if all required fields are filled
      let partNumberFound = false;
      let quantityFound = false;
      let supplierFound = false;
      let serialNumberFound = false;

      // Process each tracked barcode
      for (const trackedBarcode of Object.values(trackedBarcodes)) {
        const { barcode } = trackedBarcode;
        if (barcode.data) {
          switch (barcode.symbology) {
            case Symbology.Code39:
              if (barcode.data.startsWith('P') && !partNumberFound) {
                const partNumberInput = document.getElementById(
                  'partNumber'
                ) as HTMLInputElement;
                partNumberInput.value = barcode.data.substring(1);
                partNumberFound = true;
              } else if (barcode.data.startsWith('Q') && !quantityFound) {
                const quantityInput = document.getElementById(
                  'quantity'
                ) as HTMLInputElement;
                quantityInput.value = parseInt(
                  barcode.data.substring(1),
                  10
                ).toString();
                quantityFound = true;
              } else if (barcode.data.startsWith('V') && !supplierFound) {
                const supplierInput = document.getElementById(
                  'supplier'
                ) as HTMLInputElement;
                supplierInput.value = barcode.data.substring(1);
                supplierFound = true;
              } else if (
                (barcode.data.startsWith('S') ||
                  barcode.data.startsWith('4S')) &&
                !serialNumberFound
              ) {
                const serialNumberInput = document.getElementById(
                  'serialNumber'
                ) as HTMLInputElement;
                serialNumberInput.value = barcode.data.substring(1);
                serialNumberFound = true;
              }
              break;
            // Add cases for other symbol if needed
          }
        }

        // Check if all required fields are found
        if (
          partNumberFound &&
          quantityFound &&
          supplierFound &&
          serialNumberFound
        ) {
          // Enable the 'Done' button

          // Stop barcode tracking
          barcodeTracking.setEnabled(false);
          // Exit the loop
          break;
        }
      }
    },
  });

  doneButton?.addEventListener('click', async () => {
    // Check if the button is disabled

    const trackedBarcodesArray = Object.values(trackedBarcodes);
    let partNumber = '';
    let quantity = '';
    let supplier = '';
    let serialNumber = '';
    let lotNumber = '';

    // Process each tracked barcode
    trackedBarcodesArray.forEach((trackedBarcode) => {
      const { barcode } = trackedBarcode;
      if (barcode.data) {
        switch (barcode.symbology) {
          case Symbology.Code39:
            if (barcode.data.startsWith('P')) {
              partNumber = barcode.data.substring(1);
            } else if (barcode.data.startsWith('Q')) {
              quantity = parseInt(barcode.data.substring(1), 10).toString();
            } else if (barcode.data.startsWith('V')) {
              supplier = barcode.data.substring(1);
            } else if (
              barcode.data.startsWith('S') ||
              barcode.data.startsWith('4S')
            ) {
              serialNumber = barcode.data.substring(1);
            } else if (barcode.data.startsWith('1T')) {
              lotNumber = barcode.data.substring(1);
            }
            break;
          // Add cases for other symbol if needed
        }
      }
    });

    // Print the information to the console
    console.log('Part Number:', partNumber);
    console.log('Quantity:', quantity);
    console.log('Supplier:', supplier);
    console.log('Serial Number:', serialNumber);
    console.log('Lot number', lotNumber);

    // Enable barcode tracking
    await barcodeTracking.setEnabled(true);

    // Reset fields
    resetScannerSession();
  });
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  alert(JSON.stringify(error, null, 2));
});

function resetScannerSession() {
  // Clear all fields
  const partNumberInput = document.getElementById(
    'partNumber'
  ) as HTMLInputElement;
  const quantityInput = document.getElementById('quantity') as HTMLInputElement;
  const supplierInput = document.getElementById('supplier') as HTMLInputElement;
  const serialNumberInput = document.getElementById(
    'serialNumber'
  ) as HTMLInputElement;
  const lotNumberInput = document.getElementById(
    'lotNumber'
  ) as HTMLInputElement;

  partNumberInput.value = '';
  quantityInput.value = '';
  supplierInput.value = '';
  serialNumberInput.value = '';
  lotNumberInput.value = '';
  const canvas = document.getElementById('capturedImage') as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Enable barcode tracking

  resetScannerSession();
}
// Attach the reset function to the click event of the reset button
const resetButton = document.getElementById('resetButton');
if (resetButton) {
  resetButton.addEventListener('click', resetScannerSession);
}
