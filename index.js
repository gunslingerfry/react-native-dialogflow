'use strict';

import { NativeAppEventEmitter, Platform } from 'react-native';
import { Dialogflow } from './js/Dialogflow';
import { Dialogflow_V2 } from './js/Dialogflow_V2';
import Voice from './js/RCTVoice';

/**
 *  DIALOGFLOW V1
 */
var dialogflow = new Dialogflow();

dialogflow.setConfiguration = function (accessToken, languageTag) {
    dialogflow.accessToken = accessToken;
    dialogflow.languageTag = languageTag;
    dialogflow.sessionId = dialogflow.sessionId ? dialogflow.sessionId : dialogflow.guid();

    Voice.onSpeechStart = () => (c) => dialogflow.onListeningStarted(c);
    Voice.onSpeechEnd = () => (c) => dialogflow.onListeningFinished(c);
}

dialogflow.startListening = function (onResult, onError) {

    dialogflow.subscription = NativeAppEventEmitter.addListener(
        'onSpeechResults',
        (result) => {
            if (result.value) {
                dialogflow.requestQuery(result.value[0], onResult, onError);
            }

        }
    );

    Voice.start(dialogflow.languageTag);
}

dialogflow.finishListening = function () {
    Voice.stop();
}

export default dialogflow;


/**
 * DIALOGFLOW V2
 */
var dialogflow2 = new Dialogflow_V2();

dialogflow2.setConfiguration = async function (clientEmail, privateKey, languageTag, projectId) {
    dialogflow2.accessToken = await dialogflow2.generateAccessToken(clientEmail, privateKey);
    dialogflow2.languageTag = languageTag;
    dialogflow2.projectId = projectId;
    dialogflow2.sessionId = dialogflow2.sessionId ? dialogflow2.sessionId : dialogflow2.guid();

    // set listeners
    Voice.onSpeechStart = () => (c) => dialogflow2.onListeningStarted(c);
    Voice.onSpeechVolumeChanged = () => (c) => dialogflow2.onAudioLevel(c);

    function doQuery() {
        if (mostRecentResults != null) {
            let clonedResult = JSON.parse(JSON.stringify(mostRecentResults.value[0]));
            dialogflow2.requestQuery(clonedResult, dialogflow2.onResult, dialogflow2.onError);
            mostRecentResults = null;
        }
    }

    let mostRecentResults = null;
    Voice.onSpeechEnd = (c) => {
        if (Platform.OS === 'ios') {
            doQuery();
        }
        dialogflow2.onListeningFinished(c);
    };

    Voice.onSpeechResults = (result) => {
        if (result.value) {
            mostRecentResults = result;
        }
        if (Platform.OS === 'android') {
            doQuery();
        }
    }
}

dialogflow2.startListening = function (onResult, onError) {
    dialogflow2.onResult = onResult;
    dialogflow2.onError = onError;

    Voice.start(dialogflow2.languageTag);
}

dialogflow2.finishListening = function () {
    Voice.stop();
}

export { dialogflow2 as Dialogflow_V2 };

