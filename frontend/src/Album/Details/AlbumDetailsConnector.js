/* eslint max-params: 0 */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import * as commandNames from 'Commands/commandNames';
import { toggleAlbumsMonitored } from 'Store/Actions/albumActions';
import { executeCommand } from 'Store/Actions/commandActions';
import { clearTracks, fetchTracks } from 'Store/Actions/trackActions';
import { clearTrackFiles, fetchTrackFiles } from 'Store/Actions/trackFileActions';
import createAllArtistSelector from 'Store/Selectors/createAllArtistSelector';
import createCommandsSelector from 'Store/Selectors/createCommandsSelector';
import createUISettingsSelector from 'Store/Selectors/createUISettingsSelector';
import { findCommand, isCommandExecuting } from 'Utilities/Command';
import { registerPagePopulator, unregisterPagePopulator } from 'Utilities/pagePopulator';
import AlbumDetails from './AlbumDetails';

const selectTrackFiles = createSelector(
  (state) => state.trackFiles,
  (trackFiles) => {
    const {
      items,
      isFetching,
      isPopulated,
      error
    } = trackFiles;

    const hasTrackFiles = !!items.length;

    return {
      isTrackFilesFetching: isFetching,
      isTrackFilesPopulated: isPopulated,
      trackFilesError: error,
      hasTrackFiles
    };
  }
);

function createMapStateToProps() {
  return createSelector(
    (state, { foreignAlbumId }) => foreignAlbumId,
    (state) => state.tracks,
    selectTrackFiles,
    (state) => state.albums,
    createAllArtistSelector(),
    createCommandsSelector(),
    createUISettingsSelector(),
    (foreignAlbumId, tracks, trackFiles, albums, artists, commands, uiSettings) => {
      const sortedAlbums = _.orderBy(albums.items, 'releaseDate');
      const albumIndex = _.findIndex(sortedAlbums, { foreignAlbumId });
      const album = sortedAlbums[albumIndex];
      const artist = _.find(artists, { id: album.artistId });

      if (!album) {
        return {};
      }

      const {
        isTrackFilesFetching,
        isTrackFilesPopulated,
        trackFilesError,
        hasTrackFiles
      } = trackFiles;

      const previousAlbum = sortedAlbums[albumIndex - 1] || _.last(sortedAlbums);
      const nextAlbum = sortedAlbums[albumIndex + 1] || _.first(sortedAlbums);
      const isSearchingCommand = findCommand(commands, { name: commandNames.ALBUM_SEARCH });
      const isSearching = (
        isCommandExecuting(isSearchingCommand) &&
        isSearchingCommand.body.albumIds.indexOf(album.id) > -1
      );
      const isRenamingFiles = isCommandExecuting(findCommand(commands, { name: commandNames.RENAME_FILES, artistId: artist.id }));
      const isRenamingArtistCommand = findCommand(commands, { name: commandNames.RENAME_ARTIST });
      const isRenamingArtist = (
        isCommandExecuting(isRenamingArtistCommand) &&
        isRenamingArtistCommand.body.artistIds.indexOf(artist.id) > -1
      );

      const isFetching = tracks.isFetching || isTrackFilesFetching;
      const isPopulated = tracks.isPopulated && isTrackFilesPopulated;
      const tracksError = tracks.error;

      return {
        ...album,
        shortDateFormat: uiSettings.shortDateFormat,
        artist,
        isSearching,
        isRenamingFiles,
        isRenamingArtist,
        isFetching,
        isPopulated,
        tracksError,
        trackFilesError,
        hasTrackFiles,
        previousAlbum,
        nextAlbum
      };
    }
  );
}

const mapDispatchToProps = {
  executeCommand,
  fetchTracks,
  clearTracks,
  fetchTrackFiles,
  clearTrackFiles,
  toggleAlbumsMonitored
};

function getMonitoredReleases(props) {
  return _.map(_.filter(props.releases, { monitored: true }), 'id').sort();
}

class AlbumDetailsConnector extends Component {

  componentDidMount() {
    registerPagePopulator(this.populate);
    this.populate();
  }

  componentDidUpdate(prevProps) {
    const {
      id,
      anyReleaseOk,
      isRenamingFiles,
      isRenamingArtist
    } = this.props;

    if (
      (prevProps.isRenamingFiles && !isRenamingFiles) ||
      (prevProps.isRenamingArtist && !isRenamingArtist) ||
      !_.isEqual(getMonitoredReleases(prevProps), getMonitoredReleases(this.props)) ||
      (prevProps.anyReleaseOk === false && anyReleaseOk === true)
    ) {
      this.unpopulate();
      this.populate();
    }

    // If the id has changed we need to clear the album
    // files and fetch from the server.

    if (prevProps.id !== id) {
      this.unpopulate();
      this.populate();
    }
  }

  componentWillUnmount() {
    unregisterPagePopulator(this.populate);
    this.unpopulate();
  }

  //
  // Control

  populate = () => {
    const albumId = this.props.id;

    this.props.fetchTracks({ albumId });
    this.props.fetchTrackFiles({ albumId });
  };

  unpopulate = () => {
    this.props.clearTracks();
    this.props.clearTrackFiles();
  };

  //
  // Listeners

  onMonitorTogglePress = (monitored) => {
    this.props.toggleAlbumsMonitored({
      albumIds: [this.props.id],
      monitored
    });
  };

  onSearchPress = () => {
    this.props.executeCommand({
      name: commandNames.ALBUM_SEARCH,
      albumIds: [this.props.id]
    });
  };

  //
  // Render

  render() {
    return (
      <AlbumDetails
        {...this.props}
        onMonitorTogglePress={this.onMonitorTogglePress}
        onSearchPress={this.onSearchPress}
      />
    );
  }
}

AlbumDetailsConnector.propTypes = {
  id: PropTypes.number,
  anyReleaseOk: PropTypes.bool,
  isRenamingFiles: PropTypes.bool.isRequired,
  isRenamingArtist: PropTypes.bool.isRequired,
  isAlbumFetching: PropTypes.bool,
  isAlbumPopulated: PropTypes.bool,
  foreignAlbumId: PropTypes.string.isRequired,
  fetchTracks: PropTypes.func.isRequired,
  clearTracks: PropTypes.func.isRequired,
  fetchTrackFiles: PropTypes.func.isRequired,
  clearTrackFiles: PropTypes.func.isRequired,
  toggleAlbumsMonitored: PropTypes.func.isRequired,
  executeCommand: PropTypes.func.isRequired
};

export default connect(createMapStateToProps, mapDispatchToProps)(AlbumDetailsConnector);
