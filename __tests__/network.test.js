import * as Network from 'expo-network';
import { isOnline } from '../utils/network';

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

describe('isOnline', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is true when connected and the internet is reachable', async () => {
    Network.getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    await expect(isOnline()).resolves.toBe(true);
  });

  it('is false when there is no connection', async () => {
    Network.getNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });
    await expect(isOnline()).resolves.toBe(false);
  });

  it('is false when connected but the internet is not reachable', async () => {
    Network.getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: false,
    });
    await expect(isOnline()).resolves.toBe(false);
  });

  it('assumes online if the network check itself throws', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    Network.getNetworkStateAsync.mockRejectedValue(new Error('no module'));
    await expect(isOnline()).resolves.toBe(true);
  });
});
