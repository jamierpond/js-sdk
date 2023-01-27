import { ChannelSource } from '../types';
import { DOMMessage, DOMMessageResponse } from '../types';

let currentTrackingDetails: DOMMessageResponse|null = null;
let videoListener: (() => void)|null = null;
 
const messageReceived = (
    msg: DOMMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: DOMMessageResponse|null) => void
) => {
    console.log('[content.js]. Message received', msg);
    const response =
        window.location.host.includes("youtube") ? getDomDetailsForYoutube() : getDomDetailsForTwitch();

    sendResponse(response);
};

const getDomDetailsForYoutube = (): DOMMessageResponse|null => {
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has("v")) {
        currentTrackingDetails = null;
        return null;
    }
    const userLink = document.querySelector('.ytd-watch-metadata .ytd-channel-name a') as HTMLAnchorElement;
    const videoElement = document.querySelector('#movie_player video') as HTMLVideoElement;
    if (!userLink || !videoElement) {
        currentTrackingDetails = null;
        // Try again after a second.
        setTimeout(getDomDetailsForYoutube, 1000);
        return null;
    }
    const newTrackingDetails = {
        videoID: searchParams.get("v") || "",
        videoName: (document.querySelector('meta[name="title"]') as HTMLMetaElement)?.content || document.querySelector("title")?.textContent || "",
        channelID: userLink.href.slice(userLink.href.indexOf("/channel/") + "/channel/".length),
        channelName: userLink.textContent || "",
        channelSource: ChannelSource.youtube,
        progress: 0,
        duration: videoElement?.duration || 0
    }
    currentTrackingDetails = newTrackingDetails;
    startListeningToVideoEvents(newTrackingDetails, videoElement);
    return newTrackingDetails;
};

const getDomDetailsForTwitch = (): DOMMessageResponse|null => {
    let videoID = "livestream";
    if (window.location.pathname.includes('/videos/')) {
        const index = window.location.pathname.lastIndexOf("/videos/");
        videoID = window.location.pathname.slice(index + "/videos/".length);
        // TODO(Jeremy): If we only care about live, probably just return null here.
    }

    // There may be a better way to do this, but the class names in twitch are obfuscated :-/.
    const userLink = Array.from(document.querySelectorAll('.channel-info-content a')).filter((it) => {
        return it.classList.length == 0
    })[0] as HTMLAnchorElement;
    const videoElement = document.querySelector('.video-player video') as HTMLVideoElement;

    const newTrackingDetails = {
        videoID: videoID,
        videoName: document.querySelector('*[data-a-target="stream-title"]')?.textContent || "",
        channelID: userLink?.href?.slice(userLink?.href.lastIndexOf('/') + 1) || "",
        channelName: userLink?.textContent || "",
        channelSource: ChannelSource.twitch,
        progress: 0,
        duration: videoElement?.duration || 0
    };
    currentTrackingDetails = newTrackingDetails;
    startListeningToVideoEvents(newTrackingDetails, videoElement);
    return newTrackingDetails;
};

const startListeningToVideoEvents = (newTrackingDetails: DOMMessageResponse, videoElement: HTMLVideoElement) => {
    console.log(`Beginning listener on: ${JSON.stringify(newTrackingDetails)}`);
    if (videoListener) {
        videoElement.removeEventListener('timeupdate', videoListener);
    }
    videoListener = () => {
        currentTrackingDetails = {
            ...newTrackingDetails,
            progress: videoElement.currentTime,
            duration: videoElement.duration,
            prevProgress: currentTrackingDetails?.progress || 0
        };
        chrome.runtime.sendMessage({id: 'video_progress', ...currentTrackingDetails});
    };
    videoElement.addEventListener('timeupdate', videoListener);
}
 
/**
* Fired when a message is sent from either an extension process or a content script.
*/
chrome.runtime.onMessage.addListener(messageReceived);