class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      const i16 = new Int16Array(channel.length);
      for (let i = 0; i < channel.length; i += 1) {
        i16[i] = Math.max(-32768, Math.min(32767, channel[i] * 32768));
      }
      this.port.postMessage(i16.buffer, [i16.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
