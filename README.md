# angular-scroll-magic

An angular directive for ScrollMagic, define pins and tweens in markup


## Installation

`npm i -S angular-scroll-magic`


## Demo

http://homerjam.github.io/angular-scroll-magic/


## Usage

TODO


## Gotchas

ScrollMagic doesn't work as expected with Webpack, try using the `script-loader` like so:

```
    import 'script!scrollmagic';
    import 'script!scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap';
    import 'script!scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators';

    import angularScrollMagic from 'angular-scroll-magic';