import { Plugin } from 'obsidian'

export default class BeautyDiagramPlugin extends Plugin {
  async onload() {
    console.log('Beauty Diagram plugin loaded')
  }

  onunload() {
    console.log('Beauty Diagram plugin unloaded')
  }
}
