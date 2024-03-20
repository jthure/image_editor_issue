import {StyleSheet, View, Image, useWindowDimensions} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';
import React, {useCallback, useEffect, useState} from 'react';
import {
  copyFile,
  PicturesDirectoryPath,
  downloadFile,
  TemporaryDirectoryPath,
} from 'react-native-fs';

export default function App() {
  const dimensions = useWindowDimensions();
  const [scaledImage1, scaledImage2] = useScaledImage() || [];

  return (
    <View style={styles.container}>
      <Image
        source={require('./image.jpeg')}
        style={{width: dimensions.width, flex: 1}}
        resizeMode="contain"
      />
      {scaledImage1 && (
        <Image
          source={{uri: scaledImage1}}
          style={{width: dimensions.width, flex: 1}}
          resizeMode="contain"
        />
      )}
      {scaledImage2 && (
        <Image
          source={{uri: scaledImage2}}
          style={{width: dimensions.width, flex: 1}}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const useScaledImage = () => {
  const [scaledImage, setScaledImage] = useState<
    readonly [string, string] | null
  >(null);

  const scaleImage = useCallback(async () => {
    const asset = Image.resolveAssetSource(require('./image.jpeg'));
    const downloadedFile = `${TemporaryDirectoryPath}/image.jpeg`;
    const {promise} = downloadFile({
      fromUrl: asset.uri,
      toFile: downloadedFile,
    });
    await promise;

    const downloadedFileUri = `file://${downloadedFile}`;
    const {width, height} = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) =>
      Image.getSize(
        downloadedFileUri,
        (_width, _height) => resolve({width: _width, height: _height}),
        reject,
      ),
    );
    const cropResult1 = await ImageEditor.cropImage(downloadedFileUri, {
      offset: {x: 200, y: 200},
      size: {width: width - 400, height: height - 400},
    });

    const scaleFactor = 200 / width;
    const displaySize = {
      width: width * scaleFactor,
      height: height * scaleFactor,
    };

    const cropResult2 = await ImageEditor.cropImage(downloadedFileUri, {
      offset: {x: 0, y: 0},
      size: {width, height},
      displaySize,
    });

    await Promise.all([
      copyFile(cropResult1.uri, `${PicturesDirectoryPath}/crop1.jpg`),
      copyFile(cropResult2.uri, `${PicturesDirectoryPath}/crop2.jpg`),
    ]);

    setScaledImage([cropResult1.uri, cropResult2.uri]);
  }, []);
  useEffect(() => {
    scaleImage();
  }, [scaleImage]);

  return scaledImage;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
});
