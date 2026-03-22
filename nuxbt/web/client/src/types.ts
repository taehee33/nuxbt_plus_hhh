export interface ControllerState {
  state: 'initializing' | 'connecting' | 'reconnecting' | 'connected' | 'crashed';
  finished_macros: string[];
  errors: string | boolean;
  direct_input: DirectInputPacket;
  type: string;
  colour_body?: number[]; // [r, g, b]
  colour_buttons?: number[];
}

export interface DirectInputPacket {
  L_STICK: StickState;
  R_STICK: StickState;
  DPAD_UP: boolean;
  DPAD_LEFT: boolean;
  DPAD_RIGHT: boolean;
  DPAD_DOWN: boolean;
  L: boolean;
  ZL: boolean;
  R: boolean;
  ZR: boolean;
  JCL_SR: boolean;
  JCL_SL: boolean;
  JCR_SR: boolean;
  JCR_SL: boolean;
  PLUS: boolean;
  MINUS: boolean;
  HOME: boolean;
  CAPTURE: boolean;
  Y: boolean;
  X: boolean;
  B: boolean;
  A: boolean;
}

export interface StickState {
  PRESSED: boolean;
  X_VALUE: number;
  Y_VALUE: number;
  LS_UP?: boolean;
  LS_LEFT?: boolean;
  LS_RIGHT?: boolean;
  LS_DOWN?: boolean;
  RS_UP?: boolean;
  RS_LEFT?: boolean;
  RS_RIGHT?: boolean;
  RS_DOWN?: boolean;
}

export type AppState = Record<string, ControllerState>;

export interface BluetoothAdapter {
  path: string;
  address: string;
  alias: string;
  name: string;
  powered: boolean;
  discoverable: boolean;
  pairable: boolean;
  available: boolean;
  in_use: boolean;
  recommended: boolean;
  recommendation_reason: string;
  manufacturer_name: string | null;
  product_name: string | null;
  vendor_id: string | null;
  product_id: string | null;
}

export interface HostUsbDevice {
  uuid?: string;
  vendor_id?: string;
  product_id?: string;
  manufacturer_name?: string;
  product_name?: string;
  current_state?: string;
}

export interface KeyMap {
  keyboard: Record<string, string>; // Action -> Key Code
  gamepad: {
      buttons: Record<string, number>; // Action -> Button Index
      axes: Record<string, { index: number, direction: 1 | -1 }>; // Action -> Axis Index & Dir
  }
}
