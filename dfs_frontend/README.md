<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![MIT License][license-shield]][license-url]


<!-- PROJECT LOGO -->
<br />
<p align="center">

  <h1 align="center">DataGen From Schemas</h1>

  <p align="center">
    A dataset generator that produces data in JSON/XML from both JSON and XML schemas, taking advantage of its previous version's data generation from its own Domain Specific Language (DSL) models. 
    <br />
    <a href="https://github.com/wurzy/DataGen/tree/main/backend">Back end</a>
    ·
    <a href="https://github.com/wurzy/DataGen/tree/main/dfs_frontend">Front end</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#contacts">Contacts</a></li>
    <li><a href="#useful-links">Useful Links</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

**DataGen From Schemas** is an application that makes it possible to automatically generate representative synthetic datasets from JSON and XML schemas, in order to facilitate tasks such as the thorough testing of software applications and scientific endeavors in relevant areas, namely Data Science.

Its prior version is an online open-source application that allows the quick prototyping of datasets through its own Domain Specific Language (DSL) of specification of data models. **DataGen** is able to parse these models and generate synthetic datasets according to the structural and semantic restrictions stipulated, automating the whole process of data generation with spontaneous values created in runtime and/or from a library of support datasets. DataGen is available online for public use in [https://datagen.di.uminho.pt/](https://datagen.di.uminho.pt/) and its source files can be consulted [here](https://github.com/wurzy/DataGen).

The objective of this new product, DataGen From Schemas, is to expand DataGen's use cases and raise the datasets specification's abstraction level, making it possible to generate synthetic datasets directly from schemas. This new platform builds upon its prior version and acts as its complement, operating jointly and sharing the same data layer, in order to assure the compatibility of both platforms and the portability of the created DSL models between them. Its purpose is to parse schema files and generate corresponding DSL models, effectively translating the JSON/XML specification to a DataGen model, then using the original application as a middleware to generate the final datasets.

DataGen From Schemas will be available online for public use soon.<!-- , try it now: [https://datagen.di.uminho.pt/](https://datagen.di.uminho.pt/) -->

### Built With

The front end of the application is built mainly using:
* [Vuetify](https://vuetifyjs.com/)
* [Vue](https://vuejs.org/)

The back end is built using the following frameworks and tools:
* [MongoDB](https://www.mongodb.com/)
* [Node.js](https://nodejs.org/en/)
* [PEG.js](https://pegjs.org/)



<!-- GETTING STARTED -->
## Getting Started

**DataGen From Schemas** is integrated in the original application, since both components work together and are encapsulated by the same **Docker** instance. The installation process of the application is simple, assuming you meet the requirements.

### Prerequisites

* docker
* docker-compose

### Installation

1. Clone the repository
   ```sh
   $ git clone https://github.com/wurzy/DataGen.git
   ```
2. Navigate to the repository
3. Create the service and the containers
   ```sh
   $ docker-compose up -d --build
   ```
4. Open http://localhost:12081/ (default port on the docker-compose file)
5. The application is now ready to use



<!-- CONTACT -->
## Contacts

* Hugo Cardoso - [LinkedIn](https://www.linkedin.com/in/hugo-cardoso99/) - [GitHub](https://github.com/Abjiri)

And the supervisor of the project:

* José Ramalho - [LinkedIn](https://pt.linkedin.com/in/josé-carlos-ramalho-ab5535a) - [GitHub](https://github.com/jcramalho)



<!-- LINKS -->
## Useful Links

Localhost Build Link: [https://github.com/Abjiri/DataGen-From-Schemas](https://github.com/Abjiri/DataGen-From-Schemas)

Live Build Link: [https://github.com/wurzy/DataGen](https://github.com/wurzy/DataGen)

Official University of Minho Repository Entry: **awaiting publication**.<!-- [http://repositorium.sdum.uminho.pt/handle/1822/73506](http://repositorium.sdum.uminho.pt/handle/1822/73506) -->

Official OASIcs paper (Volume 104, SLATE 2022): **awaiting publication (expected: 2022-08-06)**.<!-- [https://drops.dagstuhl.de/opus/volltexte/2021/14423/](https://drops.dagstuhl.de/opus/volltexte/2021/14423/) -->

DataGen From Schemas will be available online for public use soon.<!-- , try it now: [https://datagen.di.uminho.pt/](https://datagen.di.uminho.pt/) -->


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/wurzy/DataGen/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=for-the-badge
[forks-url]: https://github.com/wurzy/DataGen/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/wurzy/DataGen/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=for-the-badge
[issues-url]: https://github.com/wurzy/DataGen/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/wurzy/DataGen/blob/main/LICENSE
