module.exports = {
    dependencies: {
        'react-native-vector-icons': {
            platforms: {
                android: null, // desabilita autolinking no android (vamos copiar manualmente)
                ios: null, // desabilita autolinking no iOS
            },
        },
    },
    assets: ['./node_modules/react-native-vector-icons/Fonts'],
};
