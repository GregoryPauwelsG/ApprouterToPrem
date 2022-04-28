const cds = require("@sap/cds");
//const { xsltProcess, xmlParse } = require('xslt-processor');
//const { toXML } = require('jstoxml');
//const SOURCE_XML = "./metadata.xml";
const fs = require('fs');
const { spawnSync } = require("child_process");
var path = require('path');

/*
const xml = require('xml-string');
var decode = require('unescape');
const generateOpenapi = require('generate-openapi')*/

const csdl = require("odata-csdl");
const lib = require("./csdl2openapi");

const toolsPath = "/home/user/projects/UI5WithCap/srv/";
const classPath = `${toolsPath}xalan/xalan.jar${path.delimiter}${toolsPath}xalan/serializer.jar`
const minimist = require("minimist");

const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./metadata.openapi.json')


class CatalogService extends cds.ApplicationService {
 init() {
   const { Books } = cds.entities("my.bookshop");

   let argv = minimist(process.argv.slice(2), {
    string: ["o", "openapi-version", "t", "target", "scheme", "host", "basePath"],
    boolean: [
      "d",
      "diagram",
      "h",
      "help",
      "p",
      "pretty",
      "r",
      "references",
      "u",
      "used-schemas-only",
      "verbose",
    ],
    alias: {
      d: "diagram",
      h: "help",
      o: "openapi-version",
      p: "pretty",
      r: "references",
      t: "target",
      u: "used-schemas-only",
      v: "odata-version",
    },
    default: {
      basePath: "/service-root",
      diagram: false,
      host: "localhost",
      "odata-version": "4.0",
      "openapi-version": "3.0.0",
      pretty: false,
      references: false,
      scheme: "http",
      verbose: false,
    },
    unknown: (arg) => {
      if (arg.substring(0, 1) == "-") {
        console.error(`Unknown option: ${arg}`);
        unknown = true;
        return false;
      }
    },
  });

   //Load all metadata
   this.on("getMetadata", async (req) => {
        transform("/home/user/projects/UI5WithCap/srv/metadata.xml")

   });

   function transform(source) {
    if (!fs.existsSync(source)) {
      console.error(`Source file not found: ${source}`);
    }
  
    const result = xalan("OData-Version.xsl", "-IN", source);
  
    transformV2V3(source, "2.0");

  }
  
  function xalan(xslt, ...args) {
    return spawnSync("java", [
      "-cp",
      classPath,
      "org.apache.xalan.xslt.Process",
      "-XSL",
      toolsPath + xslt,
      ...args,
    ]);
  }
  
  function transformV2V3(source, version) {
      console.log("classPath: "+classPath)
      console.log("toolsPath: "+toolsPath)
    const target = source.substring(0, source.lastIndexOf(".") + 1) + "tmp";
  
    const result = xalan("V2-to-V4-CSDL.xsl", "-IN", source, "-OUT", target);
  
    if (result.stderr.length) {
      console.error(result.stderr.toString());
    }

    transformV4(target, version, true);
  }
  
  function transformV4(source, version, deleteSource) {
    const target = source.substring(0, source.lastIndexOf(".") + 1) + "openapi.json";
  
    const params = ["-IN", source];
    if (!argv.u && !argv.pretty) params.push("-OUT", target);
    if (argv.basePath) params.push("-PARAM", "basePath", argv.basePath);
    if (argv.diagram) params.push("-PARAM", "diagram", argv.diagram);
    if (argv.host) params.push("-PARAM", "host", argv.host);
    params.push("-PARAM", "odata-version", version);
    params.push("-PARAM", "openapi-version", argv.o);
    if (argv.references) params.push("-PARAM", "references", argv.references);
    if (argv.scheme) params.push("-PARAM", "scheme", argv.scheme);
  
    const result = xalan("V4-CSDL-to-OpenAPI.xsl", ...params);
  
    console.log(result);

    const PORT = 3004;
    //app.get("/api-doc", (req, res) => res.json(swaggerDocument));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}`));
  } 
 
   return super.init();
 }
}

module.exports = { CatalogService };