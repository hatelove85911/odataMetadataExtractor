var argv = process.argv.slice(-2);
var fs = require('fs')
var parseString = require('xml2js').parseString;
var Builder = require('xml2js').Builder;
var entityType = argv[1]

var metadataFileContent = fs.readFileSync(argv[0])

parseString(metadataFileContent, function (err, result) {

  var originalEntitySet = result['edmx:Edmx']['edmx:DataServices'][0].Schema[0].EntityContainer[0].EntitySet
  var originalAssoSet = result['edmx:Edmx']['edmx:DataServices'][0].Schema[0].EntityContainer[0].AssociationSet
  var originalFunctionImport = result['edmx:Edmx']['edmx:DataServices'][0].Schema[0].EntityContainer[0].FunctionImport
  var originalEntityType = result['edmx:Edmx']['edmx:DataServices'][0].Schema[1].EntityType
  var originalComplexType = result['edmx:Edmx']['edmx:DataServices'][0].Schema[1].ComplexType
  var originalAssociation = result['edmx:Edmx']['edmx:DataServices'][0].Schema[1].Association

  var newEntitySet = []
  var newAssoSet = []
  var newFunctionImport = []
  var newEntityType = []
  var newComplexType = []
  var newAssociation = []

  function searchEntityType(entityType) {
    var entityObj = originalEntityType.filter(function (et) {
      return et.$.Name === entityType
    })[0]

    var assos = []
    var toEntity = []
    var complexType = []

    if (Array.isArray(entityObj.NavigationProperty) && entityObj.NavigationProperty.length > 0 ) {
      assos = entityObj.NavigationProperty.map(function (np) {
        return np.$.Relationship.split('.')[1]
      })

      var toEntity = entityObj.NavigationProperty.map(function (np) {
        return np.$.ToRole
      })
    }

    if (Array.isArray(entityObj.Property) && entityObj.Property.length > 0) {
      complexType = entityObj.Property.filter(function (p) {
        return p.$.Type.startsWith('SFOData')
      }).map(function (p) {
        return p.$.Type.split('.')[1]
      })
    }

    // entity Type
    newEntityType = newEntityType.concat(entityObj)

    // entitySet
    newEntitySet  = newEntitySet.concat(originalEntitySet.filter(function (es) {
      return es.$.Name === entityType
    }))
    // association
    newAssociation = newAssociation.concat(originalAssociation.filter(function (as) {
      return assos.some(function (asso) {
        return asso === as.$.Name
      })
    }))
    // associationSet
    newAssoSet = newAssoSet.concat(originalAssoSet.filter(function (as) {
      return assos.some(function (asso) {
        return asso === as.$.Name
      })
    }))
    // complextype
    newComplexType = newComplexType.concat(originalComplexType.filter(function (ct) {
      return complexType.some(function (name) {
        return name === ct.$.Name
      })
    }))

    toEntity.map(searchEntityType)
  }

  searchEntityType(entityType)

  result['edmx:Edmx']['edmx:DataServices'][0].Schema[0].EntityContainer[0].EntitySet = newEntitySet
  result['edmx:Edmx']['edmx:DataServices'][0].Schema[0].EntityContainer[0].AssociationSet = newAssoSet
  result['edmx:Edmx']['edmx:DataServices'][0].Schema[0].EntityContainer[0].FunctionImport = newFunctionImport
  result['edmx:Edmx']['edmx:DataServices'][0].Schema[1].EntityType = newEntityType
  result['edmx:Edmx']['edmx:DataServices'][0].Schema[1].ComplexType = newComplexType
  result['edmx:Edmx']['edmx:DataServices'][0].Schema[1].Association = newAssociation

  
  var builder = new Builder()
  var newXml = builder.buildObject(result)

  console.log(newXml)
});
