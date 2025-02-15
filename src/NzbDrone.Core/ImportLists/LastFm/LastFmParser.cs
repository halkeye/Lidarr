using System.Collections.Generic;
using System.Net;
using NzbDrone.Common.Extensions;
using NzbDrone.Common.Serializer;
using NzbDrone.Core.ImportLists.Exceptions;
using NzbDrone.Core.Parser.Model;

namespace NzbDrone.Core.ImportLists.LastFm
{
    public class LastFmParser : IParseImportListResponse
    {
        private ImportListResponse _importListResponse;

        public IList<ImportListItemInfo> ParseResponse(ImportListResponse importListResponse)
        {
            _importListResponse = importListResponse;

            var items = new List<ImportListItemInfo>();

            if (!PreProcess(_importListResponse))
            {
                return items;
            }

            var jsonResponse = Json.Deserialize<LastFmArtistResponse>(_importListResponse.Content);

            if (jsonResponse == null)
            {
                return items;
            }

            if (jsonResponse.TopArtists == null)
            {
                foreach (var item in jsonResponse.TopAlbums.Album)
                {
                    // Last.fm does provide an album MusicBrainzId, but it's
                    // for a specific release rather than a group like
                    // Lidarr wants. Matching on the name works well enough.
                    items.AddIfNotNull(new ImportListItemInfo
                    {
                        Artist = item.Artist.Name,
                        ArtistMusicBrainzId = item.Artist.Mbid,
                        Album = item.Name
                    });
                }
            }
            else
            {
                foreach (var item in jsonResponse.TopArtists.Artist)
                {
                    items.AddIfNotNull(new ImportListItemInfo
                    {
                        Artist = item.Name,
                        ArtistMusicBrainzId = item.Mbid
                    });
                }
            }

            return items;
        }

        protected virtual bool PreProcess(ImportListResponse importListResponse)
        {
            if (importListResponse.HttpResponse.StatusCode != HttpStatusCode.OK)
            {
                throw new ImportListException(importListResponse, "Import List API call resulted in an unexpected StatusCode [{0}]", importListResponse.HttpResponse.StatusCode);
            }

            if (importListResponse.HttpResponse.Headers.ContentType != null && importListResponse.HttpResponse.Headers.ContentType.Contains("text/json") &&
                importListResponse.HttpRequest.Headers.Accept != null && !importListResponse.HttpRequest.Headers.Accept.Contains("text/json"))
            {
                throw new ImportListException(importListResponse, "Import List responded with html content. Site is likely blocked or unavailable.");
            }

            return true;
        }
    }
}
