module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin jest dodawany automatycznie przez babel-preset-expo
    // gdy wykryje pakiet w node_modules – NIE dodawaj go ręcznie (podwójna transformacja = crash)
  };
};