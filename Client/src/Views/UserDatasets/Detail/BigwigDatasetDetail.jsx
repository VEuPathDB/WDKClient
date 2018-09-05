import React from 'react';

import Icon from '../../../Components/Icon/IconAlt';
import { Mesa, MesaState } from '../../../Components/Mesa';
import { makeClassifier } from '../UserDatasetUtils';
import UserDatasetDetail from './UserDatasetDetail';
import BigwigGBrowseUploader from './BigwigGBrowseUploader';

const classify = makeClassifier('UserDatasetDetail', 'BigwigDatasetDetail');

class BigwigDatasetDetail extends UserDatasetDetail {
  constructor (props) {
    super(props);
    this.renderTracksSection = this.renderTracksSection.bind(this);
    this.getTracksTableColumns = this.getTracksTableColumns.bind(this);
  }

  getTracksTableColumns () {
    const { userDataset, appUrl, rootUrl, config } = this.props;
    const { id, ownerUserId, type } = userDataset;
    const { projectId } = config;
    const { seqId } = type && type.data ? type.data : { seqId: null };
    return [
      {
        key: 'datafileName',
        name: 'Filename',
        renderCell: ({ row }) => <code>{row.datafileName}</code>
      },
      {
        key: 'main',
        name: 'GBrowse Status',
        renderCell: ({ row }) => <BigwigGBrowseUploader sequenceId={seqId} {...row} datasetId={id} rootUrl={rootUrl} appUrl={appUrl} projectId={projectId} />
      }
    ];
  }

  renderTracksSection () {
    const { userDataset, appUrl, projectName } = this.props;

    const { type } = userDataset;
    const { data } = type;

    const rows = data && Array.isArray(data.tracks) ? data.tracks : [];
    const columns = this.getTracksTableColumns({ userDataset, appUrl });
    const tracksTableState = MesaState.create({ rows, columns });

    return !rows.length ? null : userDataset.isInstalled
      ? (
      <section>
        <h3 className={classify('SectionTitle')}>
          <Icon fa="bar-chart"/>
          GBrowse Tracks
        </h3>
        <div className="TracksTable">
          <Mesa state={tracksTableState}/>
        </div>
      </section>
    ) : (
      <section>
        This dataset isn't installed to {projectName} or contains no files.
      </section>
    );
  }

  getPageSections () {
    const [ headerSection, compatSection, fileSection ] = super.getPageSections();
    return [ headerSection, compatSection, this.renderTracksSection, fileSection ];
  }
};

export default BigwigDatasetDetail;
