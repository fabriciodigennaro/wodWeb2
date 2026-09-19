export interface HapticGateway {
  buzz(pattern?: readonly number[]): void;
  supported(): boolean;
}
