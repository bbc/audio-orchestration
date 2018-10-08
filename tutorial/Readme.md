# Tutorial

_Use the bbcat-orchestration-template to create orchestrated audio experiences._

This template is an example user interface using the
[bbcat-orchestration](https://github.com/bbc/bbcat-orchestration) tools for orchestrated 
object-based audio experiences running in the web browser. Any device -- phone, tablet,
laptop -- with a modern browser can become part of the surround sound experience. This technology,
Media Device Orchestration (MDO) uses the smart rendering rules described in
[AES e-brief 461](http://www.aes.org/e-lib/browse.cfm?elib=19726) to decide which device should
play back each audio object. This template was used to deliver the
[Vostok-K Incident](https://github.com/bbc/rd-audio-vostok/) on
[BBC Taster](https://www.bbc.co.uk/taster/pilots/vostok): it was extended and customised a lot for
this audience-facing pilot. Variable length content is not considered here, object-based audio is
interpreted purely as turning individual channels or tracks on or off and routing them to different
loudspeakers.

Following this tutorial, you will create your own MDO content using a digital audio workstation of
your choice. The metadata can be authored in a spreadsheet or text editor in lieu of the
[S3A](http://www.s3a-spatialaudio.org) plugins (yet to be published). You will learn how to use
the provided scripts to encode the audio in the correct format, and how to listen to it in the
rudimentary interface provided by this template. The text, colour scheme, and images in the template
can be easily replaced to make it your own, but prior web development experience (React, Redux) is
required to make as far reaching changes as those done for the _Vostok_ pilot.

## Requirements

You'll need a few things to make this work.

You should be able to export the logical audio objects from your digital audio workstation (DAW)
into individual mono wav files.

You'll also need a spreadsheet or text editor that can export to plain-text `csv` files (e.g.
Microsoft Excel or Google Docs) to create the metadata table.

This template is written mostly in JavaScript, and you'll need `nodejs` (with the package manager
`yarn` recommended) to compile it before you can view it in the browser. You'll also need `ffmpeg`
and `python2` to encode the media and convert the metadata files. We recommend you use `git` to
checkout this repository.

_These instructions assume you're on a Mac and comfortable installing software using homebrew.
Other operating systems and installation methods are available, but the required steps might
differ slightly._

## Create your working copy of the template

Make sure `node` and `yarn` are installed. If you use Homebrew, run `brew install yarn` to install
both in one go.

* [Node.js](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/en/)

Run `git init my-mdo-experience` to create a new Git repository. Go into the directory with
`cd my-mdo-experience`.

Run `git pull git@github.com:bbc/bbcat-orchestration-template.git` to get the current version of
the template and add it to your empty repository. 

Run `yarn install` to download all dependencies, including the various build tools. They are
installed into the `node_modules` directory, this may take a few minutes the first time round.

Run `yarn dev` to compile the template and start a development server. When it says _Compiled
successfully_ you can open your browser at [localhost:8080](http://localhost:8080) to see it.

Well done! You now have a local copy of the template that you can modify as you like.

![Screenshot of the terminal and browser after creating a working copy of the template](working-copy.png)

## Create your audio files and MDO metadata table


