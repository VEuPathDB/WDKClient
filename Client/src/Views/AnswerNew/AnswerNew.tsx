import React, { useMemo, useState } from 'react';
import { SubmissionMetadata } from 'wdk-client/Actions/QuestionActions';
import { QuestionController, ResultTableSummaryViewController } from 'wdk-client/Controllers';
import { AnswerSpecResultType } from 'wdk-client/Utils/WdkResult';
import { NewStepSpec } from 'wdk-client/Utils/WdkUser';

interface Props {
  searchName: string;
}

/**
 * Renders parameters and a result table view for a search.
 */
export function AnswerNew(props: Props) {
  const { searchName } = props;
  const [submissionSpec, setSubmittionSpec] = useState<NewStepSpec>();

  const submissionMetadata: SubmissionMetadata = useMemo(() => ({
    type: 'submit-custom-form',
    onStepSubmitted: (_, _submissionSpec) => {
      setSubmittionSpec(_submissionSpec);
    }
  }), []);

  const resultType: AnswerSpecResultType | undefined = useMemo(() => submissionSpec && ({
    type: 'answerSpec',
    answerSpec: {
      searchConfig: submissionSpec.searchConfig,
      searchName: submissionSpec.searchName,
    },
    displayName: 'Results',
  }), [submissionSpec]);

  return (
    <div className="AnswerNew">
      <QuestionController
        question={searchName}
        submissionMetadata={submissionMetadata}
        showDescription={false}
        submitButtonText="Update table"
      />
      {resultType && <ResultTableSummaryViewController
        viewId={`answer:${searchName}`}
        resultType={resultType}
      />}
    </div>
  )
}