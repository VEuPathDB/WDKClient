import React from 'react';
import { PageController } from "../../../Controllers";
import { StepAnalysisView } from '../../Components/StepAnalysis/StepAnalysisView';

class StepAnalysisController extends PageController {
  renderView() {
    return (
      <StepAnalysisView
        type="analysis-menu"
        childProps={{
          recordClassDisplayName: "Gene",
          wdkModelBuildNumber: 41,
          choices: choicesFixture,
          webAppUrl: "http://plasmodb.vm.ebrc.org/plasmo.vm",
          selectedType: "go-enrichment",
          loadChoice: choice => console.log(`Tab ${choice.name} selected`)
        }}
      />
    );
  }
}

export default StepAnalysisController;

const choicesFixture = [
  {
     "hasParameters":true,
     "displayName":"Experiments with Similar Results",
     "releaseVersion":"32",
     "name":"datasetGeneList",
     "description":"<p>Find Experiments which have a gene list that is similar to your result set. Gene lists could be generated in many ways including publications, automated differential expression (current list) or manual curation.</p>",
     "shortDescription":"Find Experiments that have a gene list that is similar to your result set."
  },
  {
     "hasParameters":true,
     "displayName":"Gene Ontology Enrichment",
     "releaseVersion":"22",
     "name":"go-enrichment",
     "description":"<p>The Gene Ontology (GO) is a public resource that develops organism \n            independent ontologies (structured controlled vocabularies) that describe \n            a gene&rsquo;s molecular function, cellular component or biological processes. \n            GO Terms are associated with genes as a form of annotation. \n            This tool looks for enriched GO terms &#8212; GO terms that appear in the genes of \n            your search result (subset) more frequently than they do in the set of all genes \n            for that organism (background).\n           </p>\n           <p>For statistical reasons, this analysis can only be performed on a set of genes \n             from a single organism. If your gene result contains genes from several organisms, \n             use the Filter Table to limit your gene result. Then choose an Ontology, a GO Association \n             Source, and a P-Value Cutoff and click Submit.\n           </p>\n           <p> By selecting GOSlim_generic_only for the GO subset parameter the background dataset\n             and the gene list will be limited to GO terms from the GO Slim generic subset. \n           </p>\n           <p>Hover over the help icon <div class=\"HelpTrigger\"><i class=\"fa fa-question-circle\"></i></div>\n             next to each parameter for more information about that parameter.\n           </p>",
     "customThumbnail":"wdkCustomization/images/go-analysis-logo.png",
     "shortDescription":"Find Gene Ontology terms that are enriched in your gene result."
  },
  {
     "hasParameters":true,
     "displayName":"Metabolic Pathway Enrichment",
     "releaseVersion":"22",
     "name":"pathway-enrichment",
     "description":"",
     "customThumbnail":"wdkCustomization/images/pathway-analysis-logo2.png",
     "shortDescription":"Find Metabolic Pathways that are enriched in your Genes result."
  },
  {
     "hasParameters":true,
     "displayName":"Word Enrichment",
     "releaseVersion":"22",
     "name":"word-enrichment",
     "description":"",
     "customThumbnail":"wdkCustomization/images/word-analysis-logo.png",
     "shortDescription":"Find words (from the product description)  that are enriched in your Genes result."
  }
];
