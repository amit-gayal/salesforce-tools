import { LightningElement, api } from 'lwc';

export default class AudioPlayer extends LightningElement {
    @api
    audioUrl = '';
    
    @api
    title = 'Audio Player';
    
    @api
    avatarVariant = 'circle';
    
    @api
    avatarUrl = '';
    
    @api
    avatarIcon = '';

    @api
    showVolumeBar = false;

    @api
    currentVolume = 0.5;

    @api
    enableLogging = false;

    @api
    showTitle;

    hasLoaded = false;
    fullLength = '--:--';
    currentMarker = '--:--';
    progress = 0;

    isValidAudio = false;

    connectedCallback() {
        this.writeLog('Audio url: ' + this.audioUrl);
    }

    renderedCallback() {
        if (!this.hasLoaded) {
            this.voicemail.volume = this.currentVolume;
            this.hasLoaded = true;
            this.fullLength = this.voicemail.duration;
            if (this.fullLength) {
                this.isValidAudio = true;
            }
            this.dispatchEvent(new CustomEvent('audiovalidation', {
                detail: {
                    isValid: this.isValidAudion
                }
            }));
            this.writeLog('duration ' + this.voicemail.duration);
        }
    }

    handleMetadata(e) {
        this.currentMarker = "00:00";
        this.fullLength = this.parseTime(this.voicemail.duration);
    }

    parseTime(s){
        let flen = parseInt(s);
        if (flen > 60) {
            flen = parseInt(flen / 60) + '.' + (flen % 60 < 10 ? ('0' + flen % 60) : (flen % 60));
        }
        else {
            flen = '00.' + (flen < 10 ? '0' + flen : flen);
        }
        flen = flen.toString().replace('.', ':');
        return flen;
    }

    handlePlaying(e) {
        this.writeLog('currentMarker ' + this.voicemail.currentTime);
        //this.currentMarker = (this.voicemail.currentTime.toFixed(2)).replace('.',':')
        this.currentMarker = this.parseTime(this.voicemail.currentTime);
        this.progress = (this.voicemail.currentTime / this.voicemail.duration).toFixed(2) * 100;
        this.writeLog('========================================');
        this.writeLog('currentMarker ' + this.currentMarker);
        this.writeLog('progress ' + this.progress);
        this.writeLog('========================================');
    }

    handleEnd(e) {
        this.currentMarker = "0:00";
        this.progress = 0;
        this.getControl('play').disabled = false;
        this.getControl('pause').disabled = true;
    }

    handleVolumeSlider(e) {
        this.currentVolume = parseFloat(e.target.value);
        this.voicemail.volume = this.currentVolume;
    }

    handleControls(e) {
        if (e && e.target.name && this.voicemail) {
            let curVol = (this.voicemail.volume).toFixed(2);
            this.writeLog('Play duration ' + this.voicemail.duration);
            switch (e.target.name) {
                case 'play':
                    this.writeLog('Play duration ' + this.voicemail.currentTime);
                    this.voicemail.play();
                    e.target.disabled = true;
                    this.getControl('pause').disabled = false;
                    break;
                case 'pause':
                    this.writeLog('Pause duration ' + this.voicemail.currentTime);
                    this.voicemail.pause();
                    this.getControl('play').disabled = false;
                    e.target.disabled = true;
                    break;
                case 'mute':
                    if (this.voicemail.volume === 0) {
                        this.voicemail.volume = this.currentVolume;
                        e.target.variant = "destructive";
                    }
                    else {
                        this.currentVolume = this.voicemail.volume;
                        this.voicemail.volume = 0
                        e.target.variant = "brand";
                    }
                    break;
                case 'lowvolume': 
                    this.writeLog('>> Current volume; ' + this.voicemail.volume);
                    if (this.voicemail.volume - 0.1 >= 0) {
                        this.voicemail.volume -= 0.1;
                    }
                    this.currentVolume = this.voicemail.volume;
                    
                    let calculatedLowVolume = parseFloat(this.currentVolume.toFixed(2));
                    this.getControl('high').disabled = (calculatedLowVolume === 0.999);

                    e.target.disabled = (calculatedLowVolume <= 0);
                    this.getControl('mute').variant = (calculatedLowVolume <= 0) ? "brand" : "destructive";
                    
                    //Slide down
                    this.currentVolume = this.voicemail.volume;
                    this.writeLog('<< New volume; ' + this.voicemail.volume);
                    break;
                case 'highvolume': 
                    this.writeLog('>> Current volume; ' + this.voicemail.volume);
                    if (this.voicemail.volume + 0.1 <= 1) {
                        this.voicemail.volume += 0.1;
                    }
                    this.currentVolume = this.voicemail.volume;

                    let calculatedHighVolume = parseFloat(this.currentVolume.toFixed(2));
                    this.getControl('low').disabled = (calculatedHighVolume <= 0);

                    e.target.disabled = (calculatedHighVolume >= 0.999);
                    this.getControl('mute').variant = "destructive";
                    
                    //Slide up
                    this.currentVolume = this.voicemail.volume;
                    
                    this.writeLog('<< New volume; ' + this.voicemail.volume);
                    break;
            }
        }
    }

    get voicemail() {
        return this.template.querySelector('.voicemail');
    }

    getControl(type) {
        return this.template.querySelector('.' + type);
    }

    toggleProgress() {
        if (this.isProgressing) {
            // stop
            this.isProgressing = false;
            clearInterval(this._interval);
        } else {
            // start
            this.isProgressing = true;
            this._interval = setInterval(() => {
                this.progress = this.progress === 100 ? 0 : this.progress + 1;
            }, 200);
        }
    }

    disconnectedCallback() {
        // it's needed for the case the component gets disconnected
        // and the progress is being increased
        // this code doesn't show in the example
        clearInterval(this._interval);
    }

    writeLog(ob) {
        if (this.enableLogging) {
            console.log(ob);
        }
    }
}
