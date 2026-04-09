import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Replace these with your real AdMob unit IDs from admob.google.com before submitting to store
const UNIT_IDS = {
  android: 'ca-app-pub-6336933046780764/4822333483',
  ios:     'ca-app-pub-6336933046780764/4822333483',
};

const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : (Platform.OS === 'android' ? UNIT_IDS.android : UNIT_IDS.ios);

export default function AdBanner() {
  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
