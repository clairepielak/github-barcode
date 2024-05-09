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

let trackedBarcodes: Record<string, TrackedBarcode> = {};
let barcodeTracking: BarcodeTracking | null = null;

async function run(): Promise<void> {
  define({
    'sdc-ui-button': SdcUiButton,
    'sdc-ui-drawer-bottom': SdcUiDrawerBottom,
    'sdc-ui-barcode-list': SdcUiBarcodeList,
    'sdc-ui-barcode-list-item': SdcUiBarcodeListItem,
  });
  document.body.classList.add('componentsDefined');

  const view: DataCaptureView = new DataCaptureView();
  view.connectToElement(document.getElementById('data-capture-view')!);
  view.showProgressBar();

  await configure({
    licenseKey: 'AmeEyDv0H4LeFY45hg9oA84P/kF2RdZYIBIAWWYYZug0dGjzhVhGVtoffvgzJHARcGAZFfZ0Va7WeLxXPW/T6ww3H63uf2YE4RH/2es1aYLDO7MSCi/6+CIFQy9CN1BiuE3abLRHWBABbqhp2kWdWHRmlLVOS5s0+XLmgqdFpfUBdEdz5HC1IQ53/YjnSxIB7nXp9KREzaoAV+pX/WmE2mFW4EM3YSTYRkPv7MhnWh8vbtWWxksvnUx75ptqFCFzl3LlqelTwdRJfYKtwmWVtqRbK7QddtUHiHMiYaZJeDmhafLSZkffINRoH6dpQSYFWV9Ia1ZI4NtLd46b9gmaejsbdk6XINhTpTaVOrxaHhukKUlXayrmzdZtleFsKpV+owJxhE5cjF7LUFn+IGfK9d1c7xkyX503plSW5sFuYcdSfaD72i1Zo4992eMTQWY8SULGhMtdQMMAUYK+gADFbtRE8XaSSSXuo11rVQ90Mqg5cpbYDHKBd2gBCvDcbAnlzm0ZLJl6cbeYX4k90X1H4s4VIzV9M3IMIccrFAdeTk+QFSNxcWnuoPVGBOaMeLgtkDxAQPSz04prcK+hahGeP689HNe/HDfoZOy+OgqjA6cLzQgVna4dOFbtdkzV3LxPRwoV2sTRvHNgYpV+TWe2OI0JF9pZkswT/Schsdg7vj7cTtxCfgCQYfoVzyJh6b5qeUfxqFOWGFKtaJZ9pmIUpNvx3I39VTI7E+6rvUuqHJlXVKf/J0pc/t7o3bxG9ht2w9Y+7W7NzFiYHO1cVqaH0Wq+zmdro61eNSNuFv1q8xpWCGiuEze1rlUBBpDQhjsGqOVKCECoql/vHI2DVuTFPdo3ToV35Pau8B4pclUnJH6pPNxGjwfp/T0M8ERhvdieesS2vY8Zc1hwxG34T28lvBg2hnTlICKC0/uFJuoqNLaq8Yym9kPYqtpT6T/TXbDPlJqcGmAKR04n46cPnXv/9zjbT83f3y3kH/tvoJjI5LAuw6hEZr1exOHX2VpkTBhJUV0R1btYpvHTMHzA+Jfw6RmuiAv6nl+pwW/IjMEJN9+tHqhjfsn/mrCBHUV1076qsh79VmyEDN6x3iU54zdVVpX7uRPLyerQLWbFhQ4v6A370uRe9oecdvTp4N5v52ZqC+TAZEU+AOrcrFqpZ96dWKrNXrFL+wMxYm82BO5tAT//n5SBCY1Q7qnqIT74A77ScYCGXzTv',
    libraryLocation: new URL('library/engine/', document.baseURI).toString(),
    moduleLoaders: [barcodeCaptureLoader({ highEndBlurryRecognition: true })],
  });

  view.setProgressBarPercentage(null);
  view.setProgressBarMessage('Accessing Camera...');

  const context: DataCaptureContext = await DataCaptureContext.create();
  await view.setContext(context);

  const camera: Camera = Camera.default;
  const cameraSettings = BarcodeTracking.recommendedCameraSettings;
  await camera.applySettings(cameraSettings);
  await context.setFrameSource(camera);

  const settings: BarcodeTrackingSettings = BarcodeTrackingSettings.forScenario(
    BarcodeTrackingScenario.A
  );
  settings.enableSymbologies([
    Symbology.DataMatrix,
    Symbology.Code39,
    Symbology.Code128,
    Symbology.InterleavedTwoOfFive,
  ]);

  barcodeTracking = await BarcodeTracking.forContext(context, settings);
  await barcodeTracking.setEnabled(true);
  
  barcodeTracking.addListener({
    didUpdateSession: (
      barcodeTrackingMode: BarcodeTracking,
      session: BarcodeTrackingSession
    ) => {
      trackedBarcodes = session.trackedBarcodes;
      processTrackedBarcodes();
    },
    
  });

  view.addControl(new CameraSwitchControl());
  await BarcodeTrackingBasicOverlay.withBarcodeTrackingForViewWithStyle(
    barcodeTracking,
    view,
    BarcodeTrackingBasicOverlayStyle.Frame
  );

  await camera.switchToDesiredState(FrameSourceState.On);
  await barcodeTracking.setEnabled(true);
  view.hideProgressBar();

  const doneButton = document.getElementById('doneButton') as SdcUiButton;
  const resetButton = document.getElementById('resetButton');
  const partNumberInput = document.getElementById('partNumber') as HTMLInputElement;
const quantityInput = document.getElementById('quantity') as HTMLInputElement;
const supplierInput = document.getElementById('supplier') as HTMLInputElement;
const serialNumberInput = document.getElementById('serialNumber') as HTMLInputElement;
const lotNumberInput = document.getElementById('lot') as HTMLInputElement;

  resetButton?.addEventListener('click', resetScannerSession);
  doneButton?.addEventListener('click', handleDoneButtonClick);
  
  function isAnyFieldEmpty(): boolean {
    return (
      partNumberInput.value.trim() === '' ||
      quantityInput.value.trim() === '' ||
      supplierInput.value.trim() === '' ||
      serialNumberInput.value.trim() === '' ||
      lotNumberInput.value.trim() === ''
    );
  }
  function updateDoneButtonState() {
    doneButton.disabled = isAnyFieldEmpty();
  }
  partNumberInput.addEventListener('input', updateDoneButtonState);
quantityInput.addEventListener('input', updateDoneButtonState);
supplierInput.addEventListener('input', updateDoneButtonState);
serialNumberInput.addEventListener('input', updateDoneButtonState);
lotNumberInput.addEventListener('input', updateDoneButtonState);

// Initially update the "Done" button state
updateDoneButtonState();
}

function processTrackedBarcodes(): void {
  let partNumberFound = false;
  let quantityFound = false;
  let supplierFound = false;
  let serialNumberFound = false;
  let lotNumberFound = false;

  for (const trackedBarcode of Object.values(trackedBarcodes)) {
    const { barcode } = trackedBarcode;
    if (barcode.data) {
      switch (barcode.symbology) {
        case Symbology.Code39:
          if (barcode.data.startsWith('P') && !partNumberFound) {
            setInputElementValue('partNumber', barcode.data.substring(1));
            partNumberFound = true;
          } else if (barcode.data.startsWith('Q') && !quantityFound) {
            setInputElementValue(
              'quantity',
              parseInt(barcode.data.substring(1), 10).toString()
            );
            quantityFound = true;
          } else if (barcode.data.startsWith('V') && !supplierFound) {
            setInputElementValue('supplier', barcode.data.substring(1));
            supplierFound = true;
          } else if (
            (barcode.data.startsWith('S') || barcode.data.startsWith('4S')) &&
            !serialNumberFound
          ) {
            setInputElementValue('serialNumber', barcode.data.substring(1));
            serialNumberFound = true;
          } else if (barcode.data.startsWith('1T') && !lotNumberFound) {
            setInputElementValue('lot', barcode.data.substring(2));
            lotNumberFound = true;
          }
          break;
      }
    }

    if (
      partNumberFound &&
      quantityFound &&
      supplierFound &&
      serialNumberFound &&
      lotNumberFound
    ) {
      barcodeTracking?.setEnabled(false);
      
      break;
    }
  }
  
}



function resetScannerSession(): void {
  const inputIds = ['partNumber', 'quantity', 'supplier', 'serialNumber', 'lot'];
  inputIds.forEach((id) => setInputElementValue(id, ''));

  trackedBarcodes = {};

  const canvas = document.getElementById('capturedImage') as HTMLCanvasElement;
  if (canvas) {
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  barcodeTracking?.setEnabled(true);
}

function handleDoneButtonClick(): void {
  processTrackedBarcodes();
  

  const trackedBarcodesArray = Object.values(trackedBarcodes);
  let partNumber = '';
  let quantity = '';
  let supplier = '';
  let serialNumber = '';
  let lotNumber = '';

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
            lotNumber = barcode.data.substring(2);
          }
          break;
      }
    }
  });
  var audioContext = new AudioContext();
  function beep(volume: any, frequency: any, duration: any) {
    var oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = "square";
    gainNode.gain.value = volume * 0.01;
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration * 0.001);
}
  console.log('Part Number:', partNumber);
  console.log('Quantity:', quantity);
  console.log('Supplier:', supplier);
  console.log('Serial Number:', serialNumber);
  console.log('Lot number:', lotNumber);
  resetScannerSession();
}


function setInputElementValue(id: string, value: string): void {
  const input = document.getElementById(id) as HTMLInputElement;
  if (input) {
    input.value = value;
  }
}

run().catch((error: unknown) => {
  console.error(error);
  alert(JSON.stringify(error, null, 2));
});
