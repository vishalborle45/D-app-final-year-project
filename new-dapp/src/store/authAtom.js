import { atom } from 'recoil';

export const authState = atom({
    key: 'authState', // Unique key for this atom
    default: {
        isSignedIn: false,
        publicKey: null,
    },
});
