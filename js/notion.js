// Notion API client and utilities for photo gallery

// Import Notion client
import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl) {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }
    throw Error("Failed to extract page ID from URL");
}

export const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: string}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
    const childDatabases = [];

    try {
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            for (const block of response.results) {
                if (block.type === "child_database") {
                    const databaseId = block.id;

                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find a Notion database with the matching title
export async function findDatabaseByTitle(title) {
    const databases = await getNotionDatabases();

    for (const db of databases) {
        if (db.title && Array.isArray(db.title) && db.title.length > 0) {
            const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title, properties) {
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

// Photo database operations
export async function createPhotosDatabase() {
    return await createDatabaseIfNotExists("Photos", {
        Name: {
            title: {}
        },
        OriginalName: {
            rich_text: {}
        },
        Category: {
            select: {
                options: [
                    { name: "memories", color: "blue" },
                    { name: "friends", color: "green" },
                    { name: "family", color: "orange" },
                    { name: "travel", color: "purple" },
                    { name: "food", color: "pink" },
                    { name: "selfies", color: "yellow" },
                    { name: "nature", color: "green" },
                    { name: "pets", color: "brown" },
                    { name: "celebration", color: "red" },
                    { name: "work", color: "gray" },
                    { name: "hobby", color: "blue" },
                    { name: "screenshots", color: "default" },
                    { name: "documents", color: "gray" },
                    { name: "favorites", color: "red" },
                    { name: "shopping", color: "pink" },
                    { name: "sports", color: "orange" },
                    { name: "education", color: "blue" },
                    { name: "fitness", color: "green" },
                    { name: "art", color: "purple" },
                    { name: "music", color: "yellow" },
                    { name: "other", color: "default" }
                ]
            }
        },
        FileSize: {
            number: {}
        },
        FileType: {
            rich_text: {}
        },
        Width: {
            number: {}
        },
        Height: {
            number: {}
        },
        UploadDate: {
            date: {}
        },
        ImageData: {
            rich_text: {}
        },
        Tags: {
            multi_select: {
                options: [
                    { name: "edited", color: "blue" },
                    { name: "favorite", color: "red" },
                    { name: "shared", color: "green" },
                    { name: "processed", color: "yellow" }
                ]
            }
        }
    });
}

// Get all photos from the Notion database
export async function getPhotos() {
    try {
        const photosDb = await findDatabaseByTitle("Photos");
        if (!photosDb) {
            console.warn("Photos database not found. Creating it...");
            await createPhotosDatabase();
            return [];
        }

        const response = await notion.databases.query({
            database_id: photosDb.id,
            sorts: [
                {
                    property: "UploadDate",
                    direction: "descending"
                }
            ]
        });

        return response.results.map((page) => {
            const properties = page.properties;
            
            return {
                id: page.id,
                fileName: properties.Name?.title?.[0]?.plain_text || "Untitled",
                originalName: properties.OriginalName?.rich_text?.[0]?.plain_text || "unknown",
                category: properties.Category?.select?.name || "other",
                size: properties.FileSize?.number || 0,
                type: properties.FileType?.rich_text?.[0]?.plain_text || "image/jpeg",
                width: properties.Width?.number || 0,
                height: properties.Height?.number || 0,
                uploadDate: properties.UploadDate?.date?.start ? new Date(properties.UploadDate.date.start) : new Date(),
                imageData: properties.ImageData?.rich_text?.[0]?.plain_text || "",
                tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
                downloadURL: properties.ImageData?.rich_text?.[0]?.plain_text || "" // Using ImageData as base64 data URL
            };
        });
    } catch (error) {
        console.error("Error fetching photos from Notion:", error);
        throw new Error("Failed to fetch photos from Notion");
    }
}

// Add a photo to the Notion database
export async function addPhoto(photoData) {
    try {
        const photosDb = await findDatabaseByTitle("Photos");
        if (!photosDb) {
            await createPhotosDatabase();
            return await addPhoto(photoData); // Retry after creating database
        }

        const response = await notion.pages.create({
            parent: {
                database_id: photosDb.id
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: photoData.fileName || "Untitled Photo"
                            }
                        }
                    ]
                },
                OriginalName: {
                    rich_text: [
                        {
                            text: {
                                content: photoData.originalName || photoData.fileName || "unknown"
                            }
                        }
                    ]
                },
                Category: {
                    select: {
                        name: photoData.category || "other"
                    }
                },
                FileSize: {
                    number: photoData.size || 0
                },
                FileType: {
                    rich_text: [
                        {
                            text: {
                                content: photoData.type || "image/jpeg"
                            }
                        }
                    ]
                },
                Width: {
                    number: photoData.width || 0
                },
                Height: {
                    number: photoData.height || 0
                },
                UploadDate: {
                    date: {
                        start: photoData.uploadDate ? photoData.uploadDate.toISOString() : new Date().toISOString()
                    }
                },
                ImageData: {
                    rich_text: [
                        {
                            text: {
                                content: photoData.imageData || ""
                            }
                        }
                    ]
                },
                Tags: {
                    multi_select: (photoData.tags || []).map(tag => ({ name: tag }))
                }
            }
        });

        return response.id;
    } catch (error) {
        console.error("Error adding photo to Notion:", error);
        throw new Error("Failed to add photo to Notion");
    }
}

// Update a photo in the Notion database
export async function updatePhoto(photoId, updates) {
    try {
        const properties = {};

        if (updates.fileName) {
            properties.Name = {
                title: [
                    {
                        text: {
                            content: updates.fileName
                        }
                    }
                ]
            };
        }

        if (updates.category) {
            properties.Category = {
                select: {
                    name: updates.category
                }
            };
        }

        if (updates.tags) {
            properties.Tags = {
                multi_select: updates.tags.map(tag => ({ name: tag }))
            };
        }

        await notion.pages.update({
            page_id: photoId,
            properties
        });

        return true;
    } catch (error) {
        console.error("Error updating photo in Notion:", error);
        throw new Error("Failed to update photo in Notion");
    }
}

// Delete a photo from the Notion database
export async function deletePhoto(photoId) {
    try {
        await notion.pages.update({
            page_id: photoId,
            archived: true
        });

        return true;
    } catch (error) {
        console.error("Error deleting photo from Notion:", error);
        throw new Error("Failed to delete photo from Notion");
    }
}

// Initialize the photos database
export async function initializePhotosDatabase() {
    try {
        console.log("Setting up Photos database in Notion...");
        await createPhotosDatabase();
        console.log("Photos database setup complete!");
        return true;
    } catch (error) {
        console.error("Error setting up Photos database:", error);
        throw error;
    }
}

// Export for browser usage
if (typeof window !== 'undefined') {
    window.NotionAPI = {
        getPhotos,
        addPhoto,
        updatePhoto,
        deletePhoto,
        initializePhotosDatabase
    };
}