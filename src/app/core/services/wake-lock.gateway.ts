export interface WakeLockGateway {
  acquire(): Promise<boolean>;
  release(): void;
  supported(): boolean;
}
